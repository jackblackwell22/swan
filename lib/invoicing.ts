import {
  getBusinessConfig,
  getLandlordConfig,
  isLandlordId,
  type LandlordId,
} from "@/lib/config";
import {
  findInvoiceForPeriod,
  getInvoice,
  getTenantGarageAssignments,
  insertInvoice,
  listActiveTenants,
  nextInvoiceNumber,
  recordJobRun,
  updateInvoicePdfPath,
  type InvoiceWithTenant,
  type Tenant,
  type TenantGarageAssignment,
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

function groupByLandlord(assignments: TenantGarageAssignment[]) {
  const groups = new Map<LandlordId, TenantGarageAssignment[]>();
  for (const assignment of assignments) {
    if (!isLandlordId(assignment.landlord_id)) continue;
    const list = groups.get(assignment.landlord_id) ?? [];
    list.push(assignment);
    groups.set(assignment.landlord_id, list);
  }
  return groups;
}

export function assertReadyToInvoice(assignments: TenantGarageAssignment[]) {
  if (assignments.length === 0) {
    throw new Error("Assign at least one garage (7–12) before invoicing.");
  }
  const unowned = assignments.filter((row) => !isLandlordId(row.landlord_id));
  if (unowned.length > 0) {
    const numbers = unowned.map((row) => row.garage_number).join(", ");
    throw new Error(
      `Set Jack or David as landlord for garage${unowned.length === 1 ? "" : "s"} ${numbers} before invoicing. Use Garages on the owners’ desk — do not guess.`,
    );
  }
}

export async function createInvoicesForTenant(
  tenant: Tenant,
  periodStart = currentPeriodStart(),
): Promise<{
  invoices: InvoiceWithTenant[];
  created: InvoiceWithTenant[];
  skipped: InvoiceWithTenant[];
}> {
  const assignments = getTenantGarageAssignments(tenant.id);
  assertReadyToInvoice(assignments);

  const config = getBusinessConfig();
  const { year, month } = parseISODate(periodStart);
  const issueDate = periodStart;
  const created: InvoiceWithTenant[] = [];
  const skipped: InvoiceWithTenant[] = [];
  const invoices: InvoiceWithTenant[] = [];

  for (const [landlordId, lines] of groupByLandlord(assignments)) {
    const existing = findInvoiceForPeriod(tenant.id, periodStart, landlordId);
    if (existing) {
      const full = getInvoice(existing.id)!;
      skipped.push(full);
      invoices.push(full);
      continue;
    }
    const landlord = getLandlordConfig(landlordId);
    const garageNumbers = lines.map((line) => line.garage_number);
    const amount = lines.reduce((sum, line) => sum + line.rent_pence, 0);
    const row = insertInvoice({
      tenant_id: tenant.id,
      landlord_id: landlordId,
      invoice_number: nextInvoiceNumber(year, month, landlord.code),
      period_start: periodStart,
      period_end: periodEndFor(periodStart),
      issue_date: issueDate,
      due_date: addDaysISO(issueDate, config.invoiceDueDays),
      amount_pence: amount,
      payment_reference: paymentReference(landlord.code, garageNumbers, periodStart),
      pdf_path: null,
      lines: lines.map((line) => ({
        garage_number: line.garage_number,
        amount_pence: line.rent_pence,
      })),
    });
    const full = getInvoice(row.id)!;
    const pdfPath = await writeInvoicePdf(full);
    updateInvoicePdfPath(full.id, pdfPath);
    const withPdf = { ...full, pdf_path: pdfPath };
    created.push(withPdf);
    invoices.push(withPdf);
  }

  return { invoices, created, skipped };
}

/** @deprecated Use createInvoicesForTenant — kept for a single-invoice helper. */
export async function createInvoiceForTenant(
  tenant: Tenant,
  periodStart = currentPeriodStart(),
) {
  const result = await createInvoicesForTenant(tenant, periodStart);
  const invoice = result.invoices[0];
  if (!invoice) {
    throw new Error("No invoice was created.");
  }
  return { invoice, created: result.created.some((row) => row.id === invoice.id) };
}

export async function generateMonthlyInvoices(periodStart = currentPeriodStart()) {
  const tenants = listActiveTenants();
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  for (const tenant of tenants) {
    try {
      const result = await createInvoicesForTenant(tenant, periodStart);
      created.push(...result.created.map((invoice) => invoice.invoice_number));
      skipped.push(...result.skipped.map((invoice) => invoice.invoice_number));
    } catch (error) {
      errors.push(
        `${tenant.name}: ${error instanceof Error ? error.message : "Could not invoice."}`,
      );
    }
  }
  recordJobRun(
    "monthly-invoices",
    periodStart,
    errors.length ? "partial" : "ok",
    `created ${created.length}, already present ${skipped.length}, skipped tenants ${errors.length}`,
  );
  return { periodStart, created, skipped, errors };
}

export async function regeneratePdf(invoiceId: number): Promise<string> {
  const invoice = getInvoice(invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const pdfPath = await writeInvoicePdf(invoice);
  updateInvoicePdfPath(invoice.id, pdfPath);
  return pdfPath;
}
