import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isSmtpConfigured } from "@/lib/config";

export function EmailBanner() {
  if (isSmtpConfigured()) return null;
  return (
    <Alert className="border-brick/30 bg-white">
      <AlertTitle>Email is not set up yet</AlertTitle>
      <AlertDescription>
        Invoices and PDFs still work. To send them by email, fill in SMTP_HOST,
        SMTP_PORT, SMTP_USER, SMTP_PASS and FROM_EMAIL in the configuration
        file — usually the mailbox that comes with your domain. Until then,
        download the PDF and send it yourself, or{" "}
        <Link href="/admin/invoices" className="underline underline-offset-2">
          mark an invoice as sent
        </Link>{" "}
        if you posted it.
      </AlertDescription>
    </Alert>
  );
}
