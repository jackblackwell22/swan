import fs from "node:fs";
import path from "node:path";
import { getDb, type InvoiceRow, type LandlordRow, type TenantRow } from "./db";
import {
  isSmtpConfigured,
  MISSING_LANDLORD_FROM_EMAIL,
  sendInvoiceEmail,
} from "./email";
import { isoNow, londonParts, monthLabel } from "./london";
import { writeInvoicePdf, invoicePdfAbsolutePath } from "./pdf";
import { paymentReference } from "./references";
import { formatGBP } from "./money";

type ActiveLet = {
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  garage_unit: number;
  rent_pence: number;
  landlord_id: string;
};

type Group = {
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  landlord_id: string;
  lines: { garage_unit: number; rent_pence: number }[];
};

function groupLets(rows: ActiveLet[]): Group[] {
  const map = new Map<string, Group>();
  for (const row of rows) {
    const key = `${row.tenant_id}:${row.landlord_id}`;
    let group = map.get(key);
    if (!group) {
      group = {
        tenant_id: row.tenant_id,
        tenant_name: row.tenant_name,
        tenant_email: row.tenant_email,
        landlord_id: row.landlord_id,
        lines: [],
      };
      map.set(key, group);
    }
    group.lines.push({
      garage_unit: row.garage_unit,
      rent_pence: row.rent_pence,
    });
  }
  return [...map.values()].map((group) => ({
    ...group,
    lines: group.lines.sort((a, b) => a.garage_unit - b.garage_unit),
  }));
}

export type MonthlyJobResult = {
  year: number;
  month: number;
  created: number;
  skipped: number;
  emailed: number;
  emailConfigured: boolean;
  invoices: { id: number; payment_reference: string; emailed: boolean }[];
};

export async function runMonthlyInvoices(opts?: {
  year?: number;
  month?: number;
  sendEmail?: boolean;
}): Promise<MonthlyJobResult> {
  const now = londonParts();
  const year = opts?.year ?? now.year;
  const month = opts?.month ?? now.month;
  const sendEmail = opts?.sendEmail !== false;
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT
         t.id AS tenant_id,
         t.name AS tenant_name,
         t.email AS tenant_email,
         tn.garage_unit AS garage_unit,
         tn.rent_pence AS rent_pence,
         g.landlord_id AS landlord_id
       FROM tenancies tn
       JOIN tenants t ON t.id = tn.tenant_id
       JOIN garages g ON g.unit = tn.garage_unit
       WHERE tn.ended_at IS NULL
         AND g.landlord_id IS NOT NULL
         AND g.landlord_id != ''`,
    )
    .all() as ActiveLet[];

  const groups = groupLets(rows);
  const emailConfigured = isSmtpConfigured();
  let created = 0;
  let skipped = 0;
  let emailed = 0;
  const invoices: MonthlyJobResult["invoices"] = [];

  for (const group of groups) {
    const existing = db
      .prepare(
        `SELECT id, payment_reference, emailed_at FROM invoices
         WHERE tenant_id = ? AND landlord_id = ? AND year = ? AND month = ?`,
      )
      .get(group.tenant_id, group.landlord_id, year, month) as
      | Pick<InvoiceRow, "id" | "payment_reference" | "emailed_at">
      | undefined;

    if (existing) {
      skipped += 1;
      invoices.push({
        id: existing.id,
        payment_reference: existing.payment_reference,
        emailed: Boolean(existing.emailed_at),
      });
      continue;
    }

    const landlord = db
      .prepare(`SELECT * FROM landlords WHERE id = ?`)
      .get(group.landlord_id) as LandlordRow | undefined;
    if (!landlord) continue;

    const units = group.lines.map((line) => line.garage_unit);
    const reference = paymentReference(group.landlord_id, units, year, month);
    const total = group.lines.reduce((sum, line) => sum + line.rent_pence, 0);
    const filename = `${reference}.pdf`;
    const relpath = await writeInvoicePdf({
      filename,
      landlord,
      tenantName: group.tenant_name,
      paymentReference: reference,
      year,
      month,
      lines: group.lines.map((line) => ({
        description: `Lock-up ${line.garage_unit}, ${monthLabel(year, month)}`,
        amount_pence: line.rent_pence,
      })),
      total_pence: total,
    });

    const info = db
      .prepare(
        `INSERT INTO invoices (
           tenant_id, landlord_id, year, month, payment_reference,
           total_pence, pdf_relpath, emailed_at, email_error, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
      )
      .run(
        group.tenant_id,
        group.landlord_id,
        year,
        month,
        reference,
        total,
        relpath,
        isoNow(),
      );
    const invoiceId = Number(info.lastInsertRowid);

    const insertLine = db.prepare(
      `INSERT INTO invoice_lines (invoice_id, garage_unit, description, amount_pence)
       VALUES (?, ?, ?, ?)`,
    );
    for (const line of group.lines) {
      insertLine.run(
        invoiceId,
        line.garage_unit,
        `Lock-up ${line.garage_unit}`,
        line.rent_pence,
      );
    }

    created += 1;
    let wasEmailed = false;
    if (sendEmail) {
      const result = await emailInvoice(invoiceId);
      wasEmailed = result.sent;
      if (result.sent) emailed += 1;
    }
    invoices.push({
      id: invoiceId,
      payment_reference: reference,
      emailed: wasEmailed,
    });
  }

  return {
    year,
    month,
    created,
    skipped,
    emailed,
    emailConfigured,
    invoices,
  };
}

export async function emailInvoice(invoiceId: number) {
  const db = getDb();
  const invoice = db
    .prepare(`SELECT * FROM invoices WHERE id = ?`)
    .get(invoiceId) as InvoiceRow | undefined;
  if (!invoice) return { sent: false, error: "Invoice not found." };

  const tenant = db
    .prepare(`SELECT * FROM tenants WHERE id = ?`)
    .get(invoice.tenant_id) as TenantRow | undefined;
  if (!tenant) return { sent: false, error: "Tenant not found." };

  if (!tenant.email.trim()) {
    db.prepare(`UPDATE invoices SET email_error = ? WHERE id = ?`).run(
      "No tenant email",
      invoiceId,
    );
    return { sent: false, error: "This tenant has no email address." };
  }

  if (!isSmtpConfigured()) {
    db.prepare(`UPDATE invoices SET email_error = ? WHERE id = ?`).run(
      "Email is not configured",
      invoiceId,
    );
    return { sent: false, error: "Email is not configured." };
  }

  const landlord = db
    .prepare(`SELECT * FROM landlords WHERE id = ?`)
    .get(invoice.landlord_id) as LandlordRow | undefined;
  if (!landlord) return { sent: false, error: "Landlord not found." };

  const from = landlord.from_email.trim();
  if (!from) {
    db.prepare(`UPDATE invoices SET email_error = ? WHERE id = ?`).run(
      MISSING_LANDLORD_FROM_EMAIL,
      invoiceId,
    );
    return { sent: false, error: MISSING_LANDLORD_FROM_EMAIL };
  }

  const abs = invoicePdfAbsolutePath(invoice.pdf_relpath);
  if (!fs.existsSync(abs)) {
    return { sent: false, error: "The PDF file is missing on this computer." };
  }

  const period = monthLabel(invoice.year, invoice.month);
  const pdfBuffer = fs.readFileSync(abs);
  const filename = path.basename(invoice.pdf_relpath);

  try {
    const result = await sendInvoiceEmail({
      to: tenant.email.trim(),
      from,
      subject: `${period} invoice — Swan Street Lock-Ups`,
      text: [
        `Hello ${tenant.name},`,
        "",
        `Please find attached the invoice for your Swan Street lock-up(s) for ${period}.`,
        `Amount: ${formatGBP(invoice.total_pence)}`,
        `Payment reference: ${invoice.payment_reference}`,
        "",
        "Please use that payment reference when you pay by bank transfer.",
        "",
        "Thank you,",
        "Swan Street Lock-Ups",
      ].join("\n"),
      filename,
      pdfBuffer,
    });
    if (!result.sent) {
      db.prepare(`UPDATE invoices SET email_error = ? WHERE id = ?`).run(
        result.error,
        invoiceId,
      );
      return result;
    }
    db.prepare(
      `UPDATE invoices SET emailed_at = ?, email_error = NULL WHERE id = ?`,
    ).run(isoNow(), invoiceId);
    return { sent: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    db.prepare(`UPDATE invoices SET email_error = ? WHERE id = ?`).run(
      message,
      invoiceId,
    );
    return { sent: false, error: message };
  }
}
