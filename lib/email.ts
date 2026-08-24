import nodemailer from "nodemailer";
import fs from "node:fs";
import { getBusinessConfig, getSmtpConfig, isSmtpConfigured } from "@/lib/config";
import { formatGBP, formatUKDate, periodLabel } from "@/lib/format";
import type { InvoiceWithTenant } from "@/lib/db";

export { isSmtpConfigured };

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
  await transport.sendMail({
    from: smtp.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
  return { sent: true as const };
}

export async function sendInvoiceEmail(
  invoice: InvoiceWithTenant,
  pdfPath: string,
  kind: "invoice" | "reminder" = "invoice",
) {
  const config = getBusinessConfig();
  const reminder =
    kind === "reminder"
      ? "This is a reminder that the invoice below is still unpaid.\n\n"
      : "";
  const subject =
    kind === "reminder"
      ? `Reminder: invoice ${invoice.invoice_number} — ${config.name}`
      : `Invoice ${invoice.invoice_number} — ${config.name}`;

  const bankLines =
    config.sortCode && config.accountNumber
      ? `Sort code: ${config.sortCode}\nAccount number: ${config.accountNumber}\n`
      : "";

  const text = `${reminder}Hello ${invoice.tenant_name},

Please find invoice ${invoice.invoice_number} for lock-up unit ${invoice.unit_label} (${periodLabel(invoice.period_start)}).

Amount due: ${formatGBP(invoice.amount_pence)}
Due date: ${formatUKDate(invoice.due_date)}

Pay by bank transfer using this payment reference (please include it in full):
${invoice.payment_reference}
${bankLines}
Kind regards,
${config.name}`;

  const html = `<p>${kind === "reminder" ? "This is a reminder that the invoice below is still unpaid." : ""}</p>
<p>Hello ${escapeHtml(invoice.tenant_name)},</p>
<p>Please find invoice <strong>${escapeHtml(invoice.invoice_number)}</strong> for lock-up unit ${escapeHtml(invoice.unit_label)} (${escapeHtml(periodLabel(invoice.period_start))}).</p>
<p>Amount due: <strong>${formatGBP(invoice.amount_pence)}</strong><br/>Due date: ${formatUKDate(invoice.due_date)}</p>
<p>Pay by bank transfer using this payment reference:<br/><strong style="font-size:18px">${escapeHtml(invoice.payment_reference)}</strong></p>
${bankLines ? `<p>${escapeHtml(bankLines).replace(/\n/g, "<br/>")}</p>` : ""}
<p>Kind regards,<br/>${escapeHtml(config.name)}</p>`;

  const attachments = fs.existsSync(pdfPath)
    ? [{ filename: `${invoice.invoice_number}.pdf`, path: pdfPath }]
    : undefined;

  return sendMail({
    to: invoice.tenant_email,
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
