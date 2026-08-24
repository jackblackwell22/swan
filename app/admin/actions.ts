"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { GARAGE_NUMBERS } from "@/lib/config";
import {
  createTenant,
  getInvoice,
  getStatementRow,
  getTenant,
  markInvoicePaid,
  markInvoiceSent,
  setGarageLandlord,
  updateStatementMatch,
  updateTenant,
} from "@/lib/db";
import { sendInvoiceEmail } from "@/lib/email";
import { createInvoicesForTenant, regeneratePdf } from "@/lib/invoicing";
import { runMonthlyInvoiceJob, runReminderJob } from "@/lib/jobs";
import { londonDateISO } from "@/lib/format";
import {
  applyStatementMatches,
  confirmSuggestedMatch,
  matchStatementRows,
  parseBankCsv,
} from "@/lib/matching";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/tenants");
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/garages");
}

const tenantSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  tenant_type: z.enum(["business", "private"]),
  status: z.enum(["active", "ended"]),
});

function rentToPence(raw: string, garage: number): number {
  const cleaned = raw.replace(/[£,\s]/g, "");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `Enter the monthly rent for garage ${garage} in pounds, for example 150 or 150.00`,
    );
  }
  return Math.round(value * 100);
}

function parseGarageAssignments(formData: FormData) {
  const selected = formData
    .getAll("garages")
    .map((value) => Number.parseInt(String(value), 10))
    .filter((n) => GARAGE_NUMBERS.includes(n as (typeof GARAGE_NUMBERS)[number]));
  const unique = [...new Set(selected)];
  return unique.map((garage_number) => ({
    garage_number,
    rent_pence: rentToPence(String(formData.get(`rent_${garage_number}`) || ""), garage_number),
  }));
}

export async function saveTenant(formData: FormData) {
  await requireAdmin();
  const idRaw = String(formData.get("id") || "");
  const parsed = tenantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    tenant_type: formData.get("tenant_type"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: "Please check the tenant details." };
  }
  let garages;
  try {
    garages = parseGarageAssignments(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid rent" };
  }
  if (garages.length === 0) {
    return { error: "Assign at least one of garages 7–12." };
  }
  const payload = {
    name: parsed.data.name,
    email: parsed.data.email,
    tenant_type: parsed.data.tenant_type,
    status: parsed.data.status,
    garages,
  };
  let savedId: number;
  try {
    if (idRaw) {
      updateTenant(Number(idRaw), payload);
      savedId = Number(idRaw);
    } else {
      savedId = createTenant(payload).id;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the tenant." };
  }
  revalidateAdmin();
  redirect(`/admin/tenants/${savedId}`);
}

export async function saveGarageLandlords(formData: FormData) {
  await requireAdmin();
  for (const number of GARAGE_NUMBERS) {
    const raw = String(formData.get(`landlord_${number}`) || "").trim();
    const landlordId = raw === "jack" || raw === "david" ? raw : null;
    setGarageLandlord(number, landlordId);
  }
  revalidateAdmin();
}

export async function generateInvoiceForTenant(tenantId: number) {
  await requireAdmin();
  const tenant = getTenant(tenantId);
  if (!tenant) return { error: "Tenant not found." };
  try {
    const result = await createInvoicesForTenant(tenant);
    revalidateAdmin();
    const notes: string[] = [];
    for (const invoice of result.created) {
      const lines = invoice.lines.length;
      notes.push(
        `Created ${invoice.invoice_number} (${invoice.landlord_name}${lines > 1 ? `, ${lines} line items` : ""})`,
      );
    }
    for (const invoice of result.skipped) {
      notes.push(`${invoice.invoice_number} already exists for this month`);
    }
    return {
      ok: true,
      created: result.created.length > 0,
      invoiceId: (result.created[0] ?? result.skipped[0])?.id,
      invoiceNumber: result.invoices.map((invoice) => invoice.invoice_number).join(", "),
      summary: notes.join(". ") || "No invoices to create.",
      count: result.invoices.length,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create invoices." };
  }
}

export async function markPaidAction(invoiceId: number) {
  await requireAdmin();
  markInvoicePaid(invoiceId, londonDateISO(), "manual", "Marked paid in admin");
  revalidateAdmin();
}

export async function sendInvoiceAction(invoiceId: number) {
  await requireAdmin();
  const invoice = getInvoice(invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  const pdfPath = invoice.pdf_path || (await regeneratePdf(invoice.id));
  try {
    const result = await sendInvoiceEmail(invoice, pdfPath, "invoice");
    if (!result.sent) return { error: result.reason };
    markInvoiceSent(invoice.id);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The email could not be sent.",
    };
  }
}

export async function markSentManually(invoiceId: number) {
  await requireAdmin();
  markInvoiceSent(invoiceId);
  revalidateAdmin();
}

export async function runMonthlyAction() {
  await requireAdmin();
  const result = await runMonthlyInvoiceJob();
  revalidateAdmin();
  return result;
}

export async function runRemindersAction() {
  await requireAdmin();
  const result = await runReminderJob();
  revalidateAdmin();
  return result;
}

export async function uploadStatementAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file from your bank." };
  }
  const text = await file.text();
  try {
    const parsed = parseBankCsv(text);
    if (parsed.length === 0) {
      return {
        error:
          "No incoming payments found. Check the CSV has Date, Description and Amount (or Paid in) columns.",
      };
    }
    const matched = matchStatementRows(parsed);
    const applied = applyStatementMatches(matched);
    revalidateAdmin();
    return {
      ok: true,
      batchId: applied.batchId,
      autoPaid: applied.autoPaid,
      suggested: applied.suggested,
      total: applied.rows.length,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not read that CSV.",
    };
  }
}

export async function confirmMatchAction(rowId: number) {
  await requireAdmin();
  const row = getStatementRow(rowId);
  if (!row) return { error: "Row not found." };
  confirmSuggestedMatch(row);
  updateStatementMatch(row.id, row.matched_invoice_id, "confirmed");
  revalidateAdmin();
  return { ok: true };
}
