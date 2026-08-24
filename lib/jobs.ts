import { canEmailAsLandlord, isLandlordId, isSmtpHostConfigured } from "@/lib/config";
import { listInvoices, markInvoiceSent, recordJobRun } from "@/lib/db";
import { sendInvoiceEmail } from "@/lib/email";
import { londonDateISO } from "@/lib/format";
import { generateMonthlyInvoices, regeneratePdf } from "@/lib/invoicing";

export async function runMonthlyInvoiceJob() {
  const today = londonDateISO();
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
    const send = await sendInvoiceEmail(invoice, pdfPath);
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
