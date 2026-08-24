import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getInvoice } from "@/lib/db";
import { formatGBP, formatUKDate, periodLabel } from "@/lib/format";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { getBusinessConfig, hasBankDetails, isSmtpConfigured } from "@/lib/config";

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
            Unit {invoice.unit_label}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">From</dt>
          <dd className="mt-1">
            {config.name}
            {config.address ? (
              <>
                <br />
                {config.address}
              </>
            ) : null}
            {config.email ? (
              <>
                <br />
                {config.email}
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
          <dt className="text-muted-foreground">Amount and status</dt>
          <dd className="mt-1">
            {formatGBP(invoice.amount_pence)} · {invoice.status}
            {invoice.paid_at ? (
              <>
                <br />
                Paid {formatUKDate(invoice.paid_at.slice(0, 10))}
              </>
            ) : null}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">BACS</dt>
          <dd className="mt-1 font-mono">{invoice.payment_reference}</dd>
          {hasBankDetails(config) ? (
            <dd className="mt-1">
              Sort code {config.sortCode} · Account {config.accountNumber}
            </dd>
          ) : (
            <dd className="mt-1 text-muted-foreground">
              Bank details are not in the configuration file, so they are omitted from the PDF.
            </dd>
          )}
        </div>
      </dl>
      {!isSmtpConfigured() ? (
        <p className="text-sm text-muted-foreground">
          Email is not set up, so “Email” will explain that. Download the PDF and send it from
          your own mailbox if you need to.
        </p>
      ) : null}
    </div>
  );
}
