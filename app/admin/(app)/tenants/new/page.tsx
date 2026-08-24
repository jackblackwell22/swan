import { TenantForm } from "@/components/admin/tenant-form";
import { listGarages } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function NewTenantPage() {
  const garages = listGarages();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-ink">Add tenant</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Assign one or more of lock-ups 7–12. Rent is per garage, so two units
        become two line items on the invoice (or two invoices if Jack and David
        both have a unit on the tenancy).
      </p>
      <TenantForm garages={garages} />
    </div>
  );
}
