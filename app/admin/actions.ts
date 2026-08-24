"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  createTenant,
  getInvoice,
  getStatementRow,
  getTenant,
  markInvoicePaid,
  markInvoiceSent,
  updateStatementMatch,
  updateTenant,
} from "@/lib/db";
import { isSmtpConfigured, sendInvoiceEmail } from "@/lib/email";
import { createInvoiceForTenant, regeneratePdf } from "@/lib/invoicing";
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
}

const tenantSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  unit_label: z.string().trim().min(1).max(20),
  monthly_rent: z.string().trim(),
  tenant_type: z.enum(["business", "private"]),
  status: z.enum(["active", "ended"]),
});

function rentToPence(raw: string): number {
  const cleaned = raw.replace(/[£,\s]/g, "");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Enter the monthly rent in pounds, for example 150 or 150.00");
  }
  return Math.round(value * 100);
}

export async function saveTenant(formData: FormData) {
  await requireAdmin();
  const idRaw = String(formData.get("id") || "");
  const parsed = tenantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    unit_label: formData.get("unit_label"),
    monthly_rent: formData.get("monthly_rent"),
    tenant_type: formData.get("tenant_type"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: "Please check the tenant details." };
  }
  let pence: number;
  try {
    pence = rentToPence(parsed.data.monthly_rent);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid rent" };
  }
  const payload = {
    name: parsed.data.name,
    email: parsed.data.email,
    unit_label: parsed.data.unit_label,
    monthly_rent_pence: pence,
    tenant_type: parsed.data.tenant_type,
    status: parsed.data.status,
  };
  if (idRaw) {
    updateTenant(Number(idRaw), payload);
    revalidateAdmin();
    redirect(`/admin/tenants/${idRaw}`);
  }
  const tenant = createTenant(payload);
  revalidateAdmin();
  redirect(`/admin/tenants/${tenant.id}`);
}

export async function generateInvoiceForTenant(tenantId: number) {
  await requireAdmin();
  const tenant = getTenant(tenantId);
  if (!tenant) return { error: "Tenant not found." };
  const { invoice, created } = await createInvoiceForTenant(tenant);
  revalidateAdmin();
  return {
    ok: true,
    created,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
  };
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
  if (!isSmtpConfigured()) {
    return {
      error:
        "Email is not set up yet. You can still download the PDF. Fill in SMTP_HOST and FROM_EMAIL in .env.local when the mailbox is ready.",
    };
  }
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
