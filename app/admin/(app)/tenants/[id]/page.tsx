import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TenantForm } from "@/components/admin/tenant-form";
import { GenerateInvoiceButton } from "@/components/admin/generate-invoice-button";
import { getTenant, listInvoices } from "@/lib/db";
import { formatGBP } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = getTenant(Number(id));
  if (!tenant) notFound();
  const invoices = listInvoices().filter((invoice) => invoice.tenant_id === tenant.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl text-ink">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">
            Unit {tenant.unit_label} · {formatGBP(tenant.monthly_rent_pence)} a month
          </p>
          {tenant.is_sample ? (
            <Badge variant="secondary" className="mt-2">
              Sample data — not a real tenant
            </Badge>
          ) : null}
        </div>
        <GenerateInvoiceButton tenantId={tenant.id} />
      </div>
      <TenantForm tenant={tenant} />
      <section>
        <h2 className="mb-3 text-xl text-ink">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet for this tenant.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link className="text-door underline-offset-2 hover:underline" href={`/admin/invoices/${invoice.id}`}>
                  {invoice.invoice_number}
                </Link>{" "}
                · {invoice.status} · {invoice.payment_reference}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
