import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInvoices } from "@/lib/db";
import { formatGBP, formatUKDate } from "@/lib/format";
import { InvoiceActions } from "@/components/admin/invoice-actions";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export default function InvoicesPage() {
  const invoices = listInvoices();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-ink">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Draft until emailed (or marked sent). Overdue means the due date has passed and it is not paid.
        </p>
      </div>
      {invoices.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-muted-foreground ring-1 ring-border">
          No invoices yet. Add tenants, then use “Create this month&apos;s invoices” on the home screen.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link className="text-door underline-offset-2 hover:underline" href={`/admin/invoices/${invoice.id}`}>
                      {invoice.invoice_number}
                    </Link>
                    {invoice.is_sample ? (
                      <Badge variant="secondary" className="ml-2">
                        Sample
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{invoice.tenant_name}</TableCell>
                  <TableCell className="font-mono text-xs">{invoice.payment_reference}</TableCell>
                  <TableCell>{statusLabel[invoice.status] ?? invoice.status}</TableCell>
                  <TableCell>{formatUKDate(invoice.due_date)}</TableCell>
                  <TableCell>{formatGBP(invoice.amount_pence)}</TableCell>
                  <TableCell className="text-right">
                    <InvoiceActions invoiceId={invoice.id} status={invoice.status} compact />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
