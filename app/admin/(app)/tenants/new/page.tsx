import { TenantForm } from "@/components/admin/tenant-form";

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-ink">Add tenant</h1>
      <TenantForm />
    </div>
  );
}
