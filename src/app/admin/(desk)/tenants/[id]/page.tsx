import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getTenant } from "@/lib/queries";
import { TenantForm } from "../TenantForm";

export const metadata = { title: "Edit tenant" };

export default async function EditTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const query = await searchParams;
  const tenant = getTenant(Number(id));
  if (!tenant) notFound();
  return (
    <div>
      <h1 className="font-display text-4xl">{tenant.name}</h1>
      {query.saved === "1" ? (
        <p className="mt-4 rounded-md border border-line bg-paper px-4 py-3 text-sm">
          Saved.
        </p>
      ) : null}
      <TenantForm
        tenant={tenant}
        error={query.error ? decodeURIComponent(query.error) : undefined}
      />
    </div>
  );
}
