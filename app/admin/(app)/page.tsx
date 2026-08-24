import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listEnquiries, listGarages, listInvoices, monthStats } from "@/lib/db";
import { formatGBP, formatUKDate, londonDateISO, periodLabel } from "@/lib/format";
import { currentPeriodStart } from "@/lib/invoicing";
import { RunJobsButtons } from "@/components/admin/run-jobs-buttons";
import { InvoiceActions } from "@/components/admin/invoice-actions";

export const dynamic = "force-dynamic";

function emailState(status: string) {
  return status === "draft" ? "Draft" : "Sent";
}

export default function AdminHomePage() {
  const period = currentPeriodStart();
  const stats = monthStats(period);
  const thisMonth = listInvoices().filter((invoice) => invoice.period_start === period);
  const recentEnquiries = listEnquiries().slice(0, 5);
  const today = londonDateISO();
  const unownedGarages = listGarages().filter((garage) => !garage.landlord_id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-ink">This month</h1>
          <p className="text-sm text-muted-foreground">
            {periodLabel(period)} · today {formatUKDate(today)} (UK time)
          </p>
        </div>
        <RunJobsButtons />
      </div>

      {unownedGarages.length > 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-muted-foreground ring-1 ring-border">
          Garage{unownedGarages.length === 1 ? "" : "s"}{" "}
          {unownedGarages.map((garage) => garage.number).join(", ")}{" "}
          {unownedGarages.length === 1 ? "has" : "have"} no landlord yet. Set Jack or
          David on{" "}
          <Link href="/admin/garages" className="text-door underline-offset-2 hover:underline">
            Garages
          </Link>{" "}
          before invoicing those units. The desk will not guess.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expected from active tenants</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-[family-name:var(--font-heading)]">
            {formatGBP(stats.expected)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoiced this month</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-[family-name:var(--font-heading)]">
            {formatGBP(stats.invoiced)}
            <span className="ml-2 text-sm font-sans text-muted-foreground">
              {stats.count} invoice{stats.count === 1 ? "" : "s"}
            </span>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl text-ink">This month&apos;s invoices</h2>
          <Button render={<Link href="/admin/invoices" />} variant="outline" size="sm">
            All invoices
          </Button>
        </div>
        {thisMonth.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-sm text-muted-foreground ring-1 ring-border">
            None yet. Use “Create this month&apos;s invoices” when you are ready, or add
            a tenant first.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {thisMonth.map((invoice) => (
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
                    <TableCell>{invoice.landlord_name || "—"}</TableCell>
                    <TableCell>{invoice.tenant_name}</TableCell>
                    <TableCell className="font-mono text-xs">{invoice.payment_reference}</TableCell>
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
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl text-ink">Recent enquiries</h2>
          <Button render={<Link href="/admin/enquiries" />} variant="outline" size="sm">
            All enquiries
          </Button>
        </div>
        {recentEnquiries.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-sm text-muted-foreground ring-1 ring-border">
            No website enquiries yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentEnquiries.map((enquiry) => (
              <li key={enquiry.id} className="rounded-lg bg-white p-4 text-sm ring-1 ring-border">
                <p className="font-medium text-ink">{enquiry.name}</p>
                <p className="text-muted-foreground">
                  {enquiry.email} · {enquiry.tenant_kind} · {enquiry.use_type}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
