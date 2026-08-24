import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getInvoice, getResolvedLandlord } from "@/lib/db";
import { formatGBP, formatUKDate, periodLabel } from "@/lib/format";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { addressLines, bacsLines } from "@/lib/landlords";
import {
  canEmailAsLandlord,
  getBusinessConfig,
  isLandlordId,
  isSmtpHostConfigured,
  landlordEnvPrefix,
} from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoice(Number(id));
  if (!invoice) notFound();
  const config = getBusinessConfig();
  const landlord = isLandlordId(invoice.landlord_id)
    ? getResolvedLandlord(invoice.landlord_id)
    : null;
  const fromName = landlord?.name || invoice.landlord_name || config.name;
  const fromAddress = landlord ? addressLines(landlord.address) : [];
  const payLines = landlord ? bacsLines(landlord) : [];
  const canEmail = landlord ? canEmailAsLandlord(landlord.id) : false;
  const garageLabel =
    invoice.lines.length > 0
      ? invoice.lines.map((line) => line.garage_number).join(", ")
      : invoice.unit_label;

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/admin/invoices" className="text-door underline-offset-2 hover:underline">
          All invoices
        </Link>
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl text-ink">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground">
            {periodLabel(invoice.period_start)} · {invoice.payment_reference}
          </p>
          {invoice.is_sample ? (
            <Badge variant="secondary" className="mt-2">
              Sample data
            </Badge>
          ) : null}
        </div>
        <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
      </div>
      <dl className="grid gap-4 rounded-xl bg-white p-6 text-sm ring-1 ring-border sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">To</dt>
          <dd className="mt-1">
            <Link className="text-door underline-offset-2 hover:underline" href={`/admin/tenants/${invoice.tenant_id}`}>
              {invoice.tenant_name}
            </Link>
            <br />
            {invoice.tenant_email}
            <br />
            Garage{invoice.lines.length === 1 ? "" : "s"} {garageLabel}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">From</dt>
          <dd className="mt-1">
            {fromName}
            {fromAddress.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
            {landlord?.fromEmail ? (
              <>
                <br />
                {landlord.fromEmail}
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dates</dt>
          <dd className="mt-1">
            Issued {formatUKDate(invoice.issue_date)}
            <br />
            Period {formatUKDate(invoice.period_start)} – {formatUKDate(invoice.period_end)}
            <br />
            Due {formatUKDate(invoice.due_date)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="mt-1">
            {formatGBP(invoice.amount_pence)}
            <br />
            {invoice.status === "draft" ? "Not emailed yet" : "Emailed or marked sent"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Line items</dt>
          <dd className="mt-1">
            {invoice.lines.length === 0 ? (
              formatGBP(invoice.amount_pence)
            ) : (
              <ul className="space-y-1">
                {invoice.lines.map((line) => (
                  <li key={line.id}>
                    Garage {line.garage_number} · {formatGBP(line.amount_pence)}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">BACS</dt>
          <dd className="mt-1 font-mono">{invoice.payment_reference}</dd>
          <dd className="mt-1 text-muted-foreground">
            Ask the tenant to put this reference on the bank transfer. J is Jack, D is
            David, then the garage numbers, then the month.
          </dd>
          {payLines.length > 0 ? (
            <dd className="mt-1 space-y-0.5">
              {payLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </dd>
          ) : (
            <dd className="mt-1 text-muted-foreground">
              No BACS details on file for this landlord yet, so they are omitted from
              the PDF. The payment reference is still printed.
            </dd>
          )}
        </div>
      </dl>
      {!isSmtpHostConfigured() ? (
        <p className="text-sm text-muted-foreground">
          SMTP is not set up, so “Email” will explain that. Download the PDF and send it
          from your own mailbox if you need to.
        </p>
      ) : landlord && !canEmail ? (
        <p className="text-sm text-muted-foreground">
          Email is not set up for {landlord.name}. Fill in {landlordEnvPrefix(landlord.id)}
          _FROM_EMAIL. The PDF is still ready.
        </p>
      ) : null}
    </div>
  );
}
