import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TenantForm } from "@/components/admin/tenant-form";
import { GenerateInvoiceButton } from "@/components/admin/generate-invoice-button";
import { getTenant, getTenantGarageAssignments, getTenantGarages, listGarages, listInvoices } from "@/lib/db";
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
  const assignments = getTenantGarages(tenant.id);
  const assignmentDetails = getTenantGarageAssignments(tenant.id);
  const unowned = assignmentDetails.filter((row) => !row.landlord_id);
  const garages = listGarages();
  const invoices = listInvoices().filter((invoice) => invoice.tenant_id === tenant.id);
  const garageLabel =
    assignments.length > 0
      ? assignments.map((row) => row.garage_number).join(", ")
      : tenant.unit_label;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl text-ink">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">
            Garage{assignments.length === 1 ? "" : "s"} {garageLabel || "—"} ·{" "}
            {formatGBP(tenant.monthly_rent_pence)} a month
          </p>
          {tenant.is_sample ? (
            <Badge variant="secondary" className="mt-2">
              Sample data — not a real tenant
            </Badge>
          ) : null}
        </div>
        <GenerateInvoiceButton tenantId={tenant.id} />
      </div>
      {unowned.length > 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-muted-foreground ring-1 ring-border">
          Garage{unowned.length === 1 ? "" : "s"}{" "}
          {unowned.map((row) => row.garage_number).join(", ")}{" "}
          {unowned.length === 1 ? "has" : "have"} no landlord yet. Set Jack or David on{" "}
          <Link href="/admin/garages" className="text-door underline-offset-2 hover:underline">
            Garages
          </Link>{" "}
          before invoicing.
        </p>
      ) : null}
      <TenantForm tenant={tenant} assignments={assignments} garages={garages} />
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
                · {invoice.landlord_name || "no landlord"} · {invoice.status} · {invoice.payment_reference}
                {invoice.lines.length > 1 ? ` · ${invoice.lines.length} line items` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
