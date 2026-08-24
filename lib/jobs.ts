import { canEmailAsLandlord, isLandlordId, isSmtpHostConfigured } from "@/lib/config";
import {
  getInvoice,
  invoicesNeedingReminder,
  listInvoices,
  markInvoiceSent,
  markReminderSent,
  recordJobRun,
  refreshOverdueStatuses,
} from "@/lib/db";
import { sendInvoiceEmail } from "@/lib/email";
import { londonDateISO } from "@/lib/format";
import { generateMonthlyInvoices, regeneratePdf } from "@/lib/invoicing";

export async function runMonthlyInvoiceJob() {
  const today = londonDateISO();
  refreshOverdueStatuses(today);
  const result = await generateMonthlyInvoices();
  let emailed = 0;
  let emailSkipped = 0;
  const invoices = listInvoices().filter(
    (invoice) =>
      invoice.period_start === result.periodStart &&
      result.created.includes(invoice.invoice_number),
  );
  for (const invoice of invoices) {
    if (!isLandlordId(invoice.landlord_id) || !canEmailAsLandlord(invoice.landlord_id)) {
      emailSkipped += 1;
      continue;
    }
    const pdfPath = invoice.pdf_path || (await regeneratePdf(invoice.id));
    const send = await sendInvoiceEmail(invoice, pdfPath, "invoice");
    if (send.sent) {
      markInvoiceSent(invoice.id);
      emailed += 1;
    } else {
      emailSkipped += 1;
    }
  }
  recordJobRun(
    "monthly-invoices-email",
    result.periodStart,
    "ok",
    `emailed ${emailed}, not emailed ${emailSkipped}`,
  );
  return {
    ...result,
    emailed,
    emailSkipped,
    smtp: isSmtpHostConfigured(),
  };
}

export async function runReminderJob() {
  const today = londonDateISO();
  refreshOverdueStatuses(today);
  if (!isSmtpHostConfigured()) {
    recordJobRun("reminders", today, "skipped", "Email is not set up yet.");
    return { sent7: 0, sent14: 0, skipped: true as const };
  }
  let sent7 = 0;
  let sent14 = 0;
  for (const kind of [7, 14] as const) {
    const invoices = invoicesNeedingReminder(kind, today);
    for (const invoice of invoices) {
      const fresh = getInvoice(invoice.id);
      if (!fresh || fresh.status === "paid") continue;
      if (!isLandlordId(fresh.landlord_id) || !canEmailAsLandlord(fresh.landlord_id)) {
        continue;
      }
      const pdfPath = fresh.pdf_path || (await regeneratePdf(fresh.id));
      const send = await sendInvoiceEmail(fresh, pdfPath, "reminder");
      if (send.sent) {
        markReminderSent(fresh.id, kind);
        if (fresh.status === "draft") markInvoiceSent(fresh.id);
        if (kind === 7) sent7 += 1;
        else sent14 += 1;
      }
    }
  }
  recordJobRun("reminders", today, "ok", `7-day ${sent7}, 14-day ${sent14}`);
  return { sent7, sent14, skipped: false as const };
}
