import { getBusinessConfig } from "@/lib/config";
import {
  findInvoiceForPeriod,
  getInvoice,
  insertInvoice,
  listActiveTenants,
  nextInvoiceNumber,
  recordJobRun,
  updateInvoicePdfPath,
  type InvoiceWithTenant,
  type Tenant,
} from "@/lib/db";
import {
  addDaysISO,
  lastDayOfMonth,
  londonDateISO,
  parseISODate,
  paymentReference,
} from "@/lib/format";
import { writeInvoicePdf } from "@/lib/pdf";

export function currentPeriodStart(today = londonDateISO()): string {
  const { year, month } = parseISODate(today);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function periodEndFor(periodStart: string): string {
  const { year, month } = parseISODate(periodStart);
  const last = lastDayOfMonth(year, month);
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export async function createInvoiceForTenant(
  tenant: Tenant,
  periodStart = currentPeriodStart(),
): Promise<{ invoice: InvoiceWithTenant; created: boolean }> {
  const existing = findInvoiceForPeriod(tenant.id, periodStart);
  if (existing) {
    const full = getInvoice(existing.id)!;
    return { invoice: full, created: false };
  }
  const config = getBusinessConfig();
  const { year, month } = parseISODate(periodStart);
  const issueDate = periodStart;
  const invoiceNumber = nextInvoiceNumber(year, month);
  const created = insertInvoice({
    tenant_id: tenant.id,
    invoice_number: invoiceNumber,
    period_start: periodStart,
    period_end: periodEndFor(periodStart),
    issue_date: issueDate,
    due_date: addDaysISO(issueDate, config.invoiceDueDays),
    amount_pence: tenant.monthly_rent_pence,
    payment_reference: paymentReference(tenant.unit_label, periodStart),
    pdf_path: null,
  });
  const full = getInvoice(created.id)!;
  const pdfPath = await writeInvoicePdf(full, config);
  updateInvoicePdfPath(full.id, pdfPath);
  return { invoice: { ...full, pdf_path: pdfPath }, created: true };
}

export async function generateMonthlyInvoices(periodStart = currentPeriodStart()) {
  const tenants = listActiveTenants();
  const created: string[] = [];
  const skipped: string[] = [];
  for (const tenant of tenants) {
    const result = await createInvoiceForTenant(tenant, periodStart);
    if (result.created) created.push(result.invoice.invoice_number);
    else skipped.push(result.invoice.invoice_number);
  }
  recordJobRun(
    "monthly-invoices",
    periodStart,
    "ok",
    `created ${created.length}, already present ${skipped.length}`,
  );
  return { periodStart, created, skipped };
}

export async function regeneratePdf(invoiceId: number): Promise<string> {
  const invoice = getInvoice(invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const pdfPath = await writeInvoicePdf(invoice, getBusinessConfig());
  updateInvoicePdfPath(invoice.id, pdfPath);
  return pdfPath;
}
