import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { SITE_NAME } from "./constants";
import { getDataDir } from "./db";
import { monthLabel } from "./london";
import { formatGBP } from "./money";

export type PdfLandlord = {
  name: string;
  postal_address: string;
  bacs_account_name: string;
  bacs_sort_code: string;
  bacs_account_number: string;
};

export type PdfLine = {
  description: string;
  amount_pence: number;
};

function invoicesDir() {
  const dir = path.join(getDataDir(), "invoices");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function invoicePdfAbsolutePath(relpath: string) {
  return path.join(getDataDir(), relpath);
}

function writePdf(file: string, draw: (doc: PDFKit.PDFDocument) => void) {
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const stream = fs.createWriteStream(file);
    doc.pipe(stream);
    try {
      draw(doc);
      doc.end();
    } catch (error) {
      reject(error);
      return;
    }
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
}

function nonEmpty(value: string) {
  return value.trim().length > 0;
}

export async function writeInvoicePdf(opts: {
  filename: string;
  landlord: PdfLandlord;
  tenantName: string;
  paymentReference: string;
  year: number;
  month: number;
  lines: PdfLine[];
  total_pence: number;
}) {
  const relpath = path.posix.join("invoices", opts.filename);
  const abs = path.join(invoicesDir(), opts.filename);

  await writePdf(abs, (doc) => {
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#1C56C8").text(SITE_NAME);
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(11).fillColor("#5C4033").text("Invoice");
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#2A1810").text("From");
    doc.font("Helvetica").fontSize(11).text(opts.landlord.name);
    if (nonEmpty(opts.landlord.postal_address)) {
      doc.text(opts.landlord.postal_address.trim());
    }

    doc.moveDown(0.8);
    const bacs: string[] = [];
    if (nonEmpty(opts.landlord.bacs_account_name)) {
      bacs.push(`Account name: ${opts.landlord.bacs_account_name.trim()}`);
    }
    if (nonEmpty(opts.landlord.bacs_sort_code)) {
      bacs.push(`Sort code: ${opts.landlord.bacs_sort_code.trim()}`);
    }
    if (nonEmpty(opts.landlord.bacs_account_number)) {
      bacs.push(`Account number: ${opts.landlord.bacs_account_number.trim()}`);
    }
    if (bacs.length > 0) {
      doc.font("Helvetica-Bold").fontSize(10).text("Pay by bank transfer (BACS)");
      doc.font("Helvetica").fontSize(11);
      for (const line of bacs) doc.text(line);
    }
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text(`Payment reference: ${opts.paymentReference}`);
    doc.font("Helvetica");

    doc.moveDown(0.8);
    doc.font("Helvetica-Bold").fontSize(10).text("To");
    doc.font("Helvetica").fontSize(11).text(opts.tenantName);

    doc.moveDown(0.8);
    doc.fontSize(11).text(`Period: ${monthLabel(opts.year, opts.month)}`);

    doc.moveDown(1);
    const tableTop = doc.y;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Description", 56, tableTop, { width: 340 });
    doc.text("Amount", 400, tableTop, { width: 140, align: "right" });
    doc
      .moveTo(56, tableTop + 16)
      .lineTo(540, tableTop + 16)
      .strokeColor("#C4A484")
      .stroke();

    let y = tableTop + 24;
    doc.font("Helvetica").fontSize(11).fillColor("#2A1810");
    for (const line of opts.lines) {
      doc.text(line.description, 56, y, { width: 340 });
      doc.text(formatGBP(line.amount_pence), 400, y, { width: 140, align: "right" });
      y += 20;
    }

    doc
      .moveTo(56, y + 4)
      .lineTo(540, y + 4)
      .strokeColor("#1C56C8")
      .stroke();
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Total", 56, y + 12, { width: 340 });
    doc.text(formatGBP(opts.total_pence), 400, y + 12, {
      width: 140,
      align: "right",
    });

    doc.font("Helvetica").fontSize(9).fillColor("#5C4033");
    doc.text(
      "Please use the payment reference above so the rent can be matched to this invoice.",
      56,
      y + 48,
      { width: 484 },
    );
  });

  return relpath;
}
