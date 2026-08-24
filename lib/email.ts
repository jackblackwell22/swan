import nodemailer from "nodemailer";
import fs from "node:fs";
import {
  canEmailAsLandlord,
  getBusinessConfig,
  getSmtpConfig,
  isLandlordId,
  isSmtpConfigured,
  isSmtpHostConfigured,
  landlordEnvPrefix,
} from "@/lib/config";
import { getResolvedLandlord, type InvoiceWithTenant } from "@/lib/db";
import { formatGBP, formatUKDate, periodLabel } from "@/lib/format";
import { addressLines, bacsLines } from "@/lib/landlords";

export { isSmtpConfigured, isSmtpHostConfigured };

function transporter() {
  const smtp = getSmtpConfig();
  if (!smtp) return null;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
}

async function sendMail(options: {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{ filename: string; path: string }>;
}) {
  const smtp = getSmtpConfig();
  const transport = transporter();
  if (!smtp || !transport) {
    return { sent: false as const, reason: "Email is not set up yet." };
  }
  const from = options.from || smtp.from;
  if (!from) {
    return { sent: false as const, reason: "No From address is configured." };
  }
  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
  return { sent: true as const };
}

function garagePhrase(invoice: InvoiceWithTenant): string {
  const numbers = invoice.lines.map((row) => row.garage_number);
  if (numbers.length === 0 && invoice.unit_label) return `garage ${invoice.unit_label}`;
  if (numbers.length === 1) return `garage ${numbers[0]}`;
  if (numbers.length === 2) return `garages ${numbers[0]} and ${numbers[1]}`;
  return `garages ${numbers.slice(0, -1).join(", ")} and ${numbers[numbers.length - 1]}`;
}

export async function sendInvoiceEmail(invoice: InvoiceWithTenant, pdfPath: string) {
  if (!isLandlordId(invoice.landlord_id)) {
    return {
      sent: false as const,
      reason: "This invoice has no landlord, so it cannot be emailed from Jack or David.",
    };
  }
  const landlord = getResolvedLandlord(invoice.landlord_id);
  if (!isSmtpHostConfigured()) {
    return {
      sent: false as const,
      reason:
        "Email is not set up yet. You can still download the PDF. Fill in SMTP_HOST in .env.local when the mailbox is ready.",
    };
  }
  if (!canEmailAsLandlord(invoice.landlord_id)) {
    return {
      sent: false as const,
      reason: `Email is not set up for ${landlord.name}. Fill in ${landlordEnvPrefix(invoice.landlord_id)}_FROM_EMAIL in .env.local. The PDF is still ready.`,
    };
  }

  const subject = `Invoice ${invoice.invoice_number} — ${landlord.name}`;

  const bankLines = bacsLines(landlord).join("\n");
  const addressBlock = addressLines(landlord.address).join("\n");

  const lineText =
    invoice.lines.length > 0
      ? invoice.lines
          .map((row) => `  Garage ${row.garage_number}: ${formatGBP(row.amount_pence)}`)
          .join("\n")
      : `  ${formatGBP(invoice.amount_pence)}`;

  const text = `Hello ${invoice.tenant_name},

Please find invoice ${invoice.invoice_number} from ${landlord.name} for lock-up ${garagePhrase(invoice)} (${periodLabel(invoice.period_start)}).

${lineText}

Amount due: ${formatGBP(invoice.amount_pence)}
Due date: ${formatUKDate(invoice.due_date)}

Pay by bank transfer using this payment reference (please include it in full):
${invoice.payment_reference}
${bankLines}
Kind regards,
${landlord.name}${addressBlock ? `\n${addressBlock}` : ""}
Swan Street Lock-Ups`;

  const htmlLines =
    invoice.lines.length > 0
      ? `<ul>${invoice.lines
          .map(
            (row) =>
              `<li>Garage ${row.garage_number}: ${formatGBP(row.amount_pence)}</li>`,
          )
          .join("")}</ul>`
      : "";

  const html = `<p>Hello ${escapeHtml(invoice.tenant_name)},</p>
<p>Please find invoice <strong>${escapeHtml(invoice.invoice_number)}</strong> from ${escapeHtml(landlord.name)} for lock-up ${escapeHtml(garagePhrase(invoice))} (${escapeHtml(periodLabel(invoice.period_start))}).</p>
${htmlLines}
<p>Amount due: <strong>${formatGBP(invoice.amount_pence)}</strong><br/>Due date: ${formatUKDate(invoice.due_date)}</p>
<p>Pay by bank transfer using this payment reference:<br/><strong style="font-size:18px">${escapeHtml(invoice.payment_reference)}</strong></p>
${bankLines ? `<p>${escapeHtml(bankLines).replace(/\n/g, "<br/>")}</p>` : ""}
<p>Kind regards,<br/>${escapeHtml(landlord.name)}${addressBlock ? `<br/>${escapeHtml(addressBlock).replace(/\n/g, "<br/>")}` : ""}<br/>Swan Street Lock-Ups</p>`;

  const attachments = fs.existsSync(pdfPath)
    ? [{ filename: `${invoice.invoice_number}.pdf`, path: pdfPath }]
    : undefined;

  return sendMail({
    to: invoice.tenant_email,
    from: `"${landlord.name}" <${landlord.fromEmail}>`,
    subject,
    text,
    html,
    attachments,
  });
}

export async function sendEnquiryNotification(input: {
  name: string;
  email: string;
  phone: string;
  tenant_kind: string;
  use_type: string;
  message: string;
}) {
  const config = getBusinessConfig();
  if (!config.email) {
    return { sent: false as const, reason: "No business email is set." };
  }
  const text = `New enquiry from the Swan Street Lock-Ups website.

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || "(not given)"}
Tenant type: ${input.tenant_kind}
Intended use: ${input.use_type}

Message:
${input.message}
`;
  return sendMail({
    to: config.email,
    subject: `Website enquiry from ${input.name}`,
    text,
    html: `<pre style="font-family:inherit">${escapeHtml(text)}</pre>`,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
