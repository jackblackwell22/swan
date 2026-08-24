import { requireOwner } from "@/lib/auth";
import { TenantForm } from "../TenantForm";

export const metadata = { title: "Add a tenant" };

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOwner();
  const params = await searchParams;
  return (
    <div>
      <h1 className="font-display text-4xl">Add a tenant</h1>
      <TenantForm error={params.error && params.error !== "name" ? params.error : params.error === "name" ? "Please enter a name." : undefined} />
    </div>
  );
}
