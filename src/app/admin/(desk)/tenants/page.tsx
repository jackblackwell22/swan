import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { formatGBP } from "@/lib/money";
import { listTenants } from "@/lib/queries";

export const metadata = { title: "Tenants" };

export default async function AdminTenantsPage() {
  await requireOwner();
  const tenants = listTenants();
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Tenants</h1>
          <p className="mt-2 max-w-2xl text-muted">
            A person can rent more than one of units 7–12. Each lock-up can only
            be let to one tenant at a time.
          </p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="rounded-md bg-door px-4 py-2 text-sm font-semibold text-white hover:bg-door-dark"
        >
          Add a tenant
        </Link>
      </div>
      {tenants.length === 0 ? (
        <p className="mt-8 text-muted">No tenants yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-paper">
          {tenants.map((tenant) => (
            <li key={tenant.id} className="px-4 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/admin/tenants/${tenant.id}`}
                  className="font-semibold text-door hover:underline"
                >
                  {tenant.name}
                </Link>
                {tenant.email ? (
                  <span className="text-sm text-muted">{tenant.email}</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted">
                {tenant.garages.length === 0
                  ? "No lock-ups assigned"
                  : tenant.garages
                      .map(
                        (g) =>
                          `Unit ${g.garage_unit} (${formatGBP(g.rent_pence)})`,
                      )
                      .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
