import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTenants } from "@/lib/db";
import { formatGBP } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function TenantsPage() {
  const tenants = listTenants();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-ink">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            People or businesses renting one or more of lock-ups 7–12. A garage
            can only be let to one active tenant at a time.
          </p>
        </div>
        <Button render={<Link href="/admin/tenants/new" />}>Add tenant</Button>
      </div>
      {tenants.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-muted-foreground ring-1 ring-border">
          No tenants yet. Add the people who currently have a unit.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Garages</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link className="text-door underline-offset-2 hover:underline" href={`/admin/tenants/${tenant.id}`}>
                      {tenant.name}
                    </Link>
                    {tenant.is_sample ? (
                      <Badge variant="secondary" className="ml-2">
                        Sample data
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{tenant.unit_label}</TableCell>
                  <TableCell className="capitalize">{tenant.tenant_type}</TableCell>
                  <TableCell>{formatGBP(tenant.monthly_rent_pence)}</TableCell>
                  <TableCell className="capitalize">{tenant.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
