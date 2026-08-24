import nodemailer from "nodemailer";
import { getFromEmail } from "./settings";

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
}

export function outgoingFromAddress() {
  return (
    getFromEmail() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ""
  );
}

function transport() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? "";
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });
}

export async function sendInvoiceEmail(opts: {
  to: string;
  subject: string;
  text: string;
  filename: string;
  pdfBuffer: Buffer;
}) {
  if (!isSmtpConfigured()) {
    return { sent: false as const, error: "Email is not configured." };
  }
  const from = outgoingFromAddress();
  if (!from) {
    return {
      sent: false as const,
      error: "No from-email is set. Add one on the Garages page.",
    };
  }
  const mailer = transport();
  if (!mailer) {
    return { sent: false as const, error: "Email is not configured." };
  }
  await mailer.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        filename: opts.filename,
        content: opts.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
  return { sent: true as const };
}
