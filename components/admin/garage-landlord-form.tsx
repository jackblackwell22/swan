import { GARAGE_NUMBERS, LANDLORD_NAMES, type LandlordId } from "@/lib/landlords";
import { saveGarageLandlords } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Garage } from "@/lib/db";

type GarageRow = Garage & { tenant_name: string | null; tenant_id: number | null };

export function GarageLandlordForm({ garages }: { garages: GarageRow[] }) {
  return (
    <form action={saveGarageLandlords} className="space-y-4">
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Garage</TableHead>
              <TableHead>Landlord</TableHead>
              <TableHead>Let to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {garages.map((garage) => (
              <TableRow key={garage.number}>
                <TableCell className="font-medium">{garage.number}</TableCell>
                <TableCell>
                  <select
                    name={`landlord_${garage.number}`}
                    defaultValue={garage.landlord_id ?? ""}
                    className="h-9 rounded-md border border-input bg-cream/40 px-2 text-sm"
                    aria-label={`Landlord for garage ${garage.number}`}
                  >
                    <option value="">Not set yet</option>
                    {(Object.keys(LANDLORD_NAMES) as LandlordId[]).map((id) => (
                      <option key={id} value={id}>
                        {LANDLORD_NAMES[id]}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {garage.tenant_name ?? "Empty"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {GARAGE_NUMBERS.every((n) => garages.some((g) => g.number === n)) ? null : (
        <p className="text-sm text-destructive">Garage list is incomplete.</p>
      )}
      <Button type="submit">Save landlords</Button>
    </form>
  );
}
