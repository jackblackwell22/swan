import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getLandlords,
  isSmtpHostConfigured,
  landlordEnvPrefix,
} from "@/lib/config";

export function EmailBanner() {
  const smtp = isSmtpHostConfigured();
  const landlords = getLandlords();
  const missingFrom = landlords.filter((landlord) => !landlord.fromEmail);

  if (smtp && missingFrom.length === 0) return null;

  return (
    <Alert className="border-brick/30 bg-white">
      <AlertTitle>Email is not fully set up</AlertTitle>
      <AlertDescription className="space-y-2">
        {!smtp ? (
          <p>
            Invoices and PDFs still work. To send them, fill in SMTP_HOST (and
            the usual user, password and port) for the mailbox that comes with
            your domain. Until then, download the PDF and send it yourself, or{" "}
            <Link href="/admin/invoices" className="underline underline-offset-2">
              mark an invoice as sent
            </Link>{" "}
            if you posted it.
          </p>
        ) : null}
        {missingFrom.map((landlord) => (
          <p key={landlord.id}>
            {landlord.name}’s from-email is empty ({landlordEnvPrefix(landlord.id)}
            _FROM_EMAIL). Invoices for their garages will still generate as PDFs,
            but they will not be emailed until that address is filled in.
          </p>
        ))}
      </AlertDescription>
    </Alert>
  );
}
