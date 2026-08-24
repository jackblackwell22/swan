import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { BusinessConfig } from "@/lib/config";
import { formatGBP, formatUKDate, periodLabel } from "@/lib/format";
import type { InvoiceWithTenant } from "@/lib/db";

const blue = rgb(0.118, 0.42, 0.71);
const brick = rgb(0.702, 0.353, 0.227);
const ink = rgb(0.12, 0.11, 0.09);
const muted = rgb(0.42, 0.39, 0.35);
const line = rgb(0.82, 0.78, 0.72);
const cream = rgb(0.953, 0.933, 0.894);

function invoicePdfPath(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[^A-Za-z0-9._-]/g, "_");
  return path.join(process.cwd(), "data", "invoices", `${safe}.pdf`);
}

export async function writeInvoicePdf(
  invoice: InvoiceWithTenant,
  config: BusinessConfig,
): Promise<string> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 800, width: 595.28, height: 42, color: blue });
  page.drawText(config.name, {
    x: 48,
    y: 815,
    size: 16,
    font: serifBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Invoice", {
    x: 480,
    y: 815,
    size: 16,
    font: sansBold,
    color: rgb(1, 1, 1),
  });

  let y = 760;
  page.drawText("From", { x: 48, y, size: 9, font: sansBold, color: brick });
  y -= 16;
  page.drawText(config.name, { x: 48, y, size: 11, font: serifBold, color: ink });
  if (config.address) {
    for (const part of config.address.split(",").map((s) => s.trim()).filter(Boolean)) {
      y -= 14;
      page.drawText(part, { x: 48, y, size: 10, font: sans, color: ink });
    }
  }
  if (config.email) {
    y -= 14;
    page.drawText(config.email, { x: 48, y, size: 10, font: sans, color: ink });
  }
  if (config.phone) {
    y -= 14;
    page.drawText(config.phone, { x: 48, y, size: 10, font: sans, color: ink });
  }
  if (config.vatRegistered) {
    y -= 14;
    const vatLine = config.vatNumber
      ? `VAT registered · ${config.vatNumber}`
      : "VAT registered";
    page.drawText(vatLine, { x: 48, y, size: 9, font: sans, color: muted });
  }

  let right = 760;
  const meta: Array<[string, string]> = [
    ["Invoice number", invoice.invoice_number],
    ["Invoice date", formatUKDate(invoice.issue_date)],
    ["Period", periodLabel(invoice.period_start)],
    ["Due date", formatUKDate(invoice.due_date)],
  ];
  for (const [label, value] of meta) {
    page.drawText(label, { x: 330, y: right, size: 9, font: sans, color: muted });
    page.drawText(value, { x: 430, y: right, size: 10, font: sansBold, color: ink });
    right -= 16;
  }

  y = Math.min(y, right) - 28;
  page.drawText("To", { x: 48, y, size: 9, font: sansBold, color: brick });
  y -= 16;
  page.drawText(invoice.tenant_name, { x: 48, y, size: 11, font: serifBold, color: ink });
  y -= 14;
  page.drawText(invoice.tenant_email, { x: 48, y, size: 10, font: sans, color: ink });
  y -= 14;
  page.drawText(`Lock-up unit ${invoice.unit_label}`, {
    x: 48,
    y,
    size: 10,
    font: sans,
    color: ink,
  });

  if (invoice.is_sample) {
    y -= 22;
    page.drawText("SAMPLE DATA — this invoice is for demonstration only.", {
      x: 48,
      y,
      size: 9,
      font: sansBold,
      color: brick,
    });
  }

  y -= 32;
  page.drawRectangle({ x: 48, y: y - 6, width: 499, height: 22, color: cream });
  page.drawText("Description", { x: 56, y, size: 9, font: sansBold, color: muted });
  page.drawText("Amount", { x: 490, y, size: 9, font: sansBold, color: muted });
  y -= 28;
  page.drawText(
    `Lock-up garage, unit ${invoice.unit_label} — ${periodLabel(invoice.period_start)} (${formatUKDate(invoice.period_start)} to ${formatUKDate(invoice.period_end)})`,
    { x: 56, y, size: 10, font: sans, color: ink },
  );
  page.drawText(formatGBP(invoice.amount_pence), {
    x: 480,
    y,
    size: 10,
    font: sansBold,
    color: ink,
  });
  y -= 16;
  page.drawLine({
    start: { x: 48, y },
    end: { x: 547, y },
    thickness: 0.6,
    color: line,
  });
  y -= 22;
  page.drawText("Total due", { x: 400, y, size: 11, font: sansBold, color: ink });
  page.drawText(formatGBP(invoice.amount_pence), {
    x: 470,
    y,
    size: 12,
    font: sansBold,
    color: blue,
  });

  y -= 40;
  page.drawRectangle({
    x: 48,
    y: y - 88,
    width: 499,
    height: 108,
    color: cream,
    borderColor: blue,
    borderWidth: 1,
  });
  page.drawText("How to pay", {
    x: 60,
    y: y,
    size: 11,
    font: serifBold,
    color: blue,
  });
  page.drawText("Please pay by bank transfer (BACS) using this payment reference:", {
    x: 60,
    y: y - 18,
    size: 9,
    font: sans,
    color: ink,
  });
  page.drawText(invoice.payment_reference, {
    x: 60,
    y: y - 38,
    size: 14,
    font: sansBold,
    color: ink,
  });

  if (config.sortCode && config.accountNumber) {
    page.drawText(`Sort code  ${config.sortCode}`, {
      x: 60,
      y: y - 58,
      size: 10,
      font: sans,
      color: ink,
    });
    page.drawText(`Account number  ${config.accountNumber}`, {
      x: 60,
      y: y - 74,
      size: 10,
      font: sans,
      color: ink,
    });
  } else {
    page.drawText(
      "Bank details will be confirmed separately if they are not printed here.",
      { x: 60, y: y - 60, size: 9, font: sans, color: muted },
    );
  }

  page.drawText(
    "Swan Street Lock-Ups · Swan Street, Royal Leamington Spa, Warwickshire",
    { x: 48, y: 40, size: 8, font: sans, color: muted },
  );
  page.drawText("This is not a VAT invoice unless VAT details are shown above.", {
    x: 48,
    y: 28,
    size: 8,
    font: sans,
    color: muted,
  });

  const bytes = await pdf.save();
  const filePath = invoicePdfPath(invoice.invoice_number);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, bytes);
  return filePath;
}
