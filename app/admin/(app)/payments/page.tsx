import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStatementBatch, listPayments, unpaidInvoices } from "@/lib/db";
import { formatGBP, formatUKDate } from "@/lib/format";
import { CsvUploadForm } from "@/components/admin/csv-upload-form";
import { ConfirmMatchButton } from "@/components/admin/confirm-match-button";
import { InvoiceActions } from "@/components/admin/invoice-actions";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  const unpaid = unpaidInvoices();
  const payments = listPayments();
  const statementRows = batch ? getStatementBatch(batch) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-ink">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Mark an invoice paid, or upload a bank statement CSV. Matching on the payment
          reference is automatic when the amount agrees. Matching on amount and date only
          is a suggestion you confirm — never automatic if two tenants share the same rent.
        </p>
      </div>

      <CsvUploadForm />

      {statementRows.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl text-ink">Last statement upload</h2>
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {statementRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatUKDate(row.row_date)}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.description}</TableCell>
                    <TableCell>{formatGBP(row.amount_pence)}</TableCell>
                    <TableCell className="capitalize">{row.match_kind}</TableCell>
                    <TableCell>
                      {row.match_kind === "suggested" && row.matched_invoice_id ? (
                        <ConfirmMatchButton rowId={row.id} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-xl text-ink">Still outstanding</h2>
        {unpaid.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
        ) : (
          <ul className="space-y-2 rounded-xl bg-white p-4 text-sm ring-1 ring-border">
            {unpaid.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {invoice.tenant_name} · {invoice.payment_reference} · {formatGBP(invoice.amount_pence)}
                </span>
                <InvoiceActions invoiceId={invoice.id} status={invoice.status} compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl text-ink">Recorded payments</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">None recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>How</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatUKDate(payment.paid_at.slice(0, 10))}</TableCell>
                    <TableCell>{payment.tenant_name}</TableCell>
                    <TableCell>
                      {payment.invoice_number}
                      <div className="font-mono text-xs text-muted-foreground">
                        {payment.payment_reference}
                      </div>
                    </TableCell>
                    <TableCell>{formatGBP(payment.amount_pence)}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
