import { saveLandlordAddresses } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LANDLORD_IDS, LANDLORD_NAMES, addressLines } from "@/lib/landlords";
import type { LandlordId, LandlordProfile } from "@/lib/config";

export function LandlordAddressForm({ landlords }: { landlords: LandlordProfile[] }) {
  const byId = Object.fromEntries(landlords.map((landlord) => [landlord.id, landlord])) as Record<
    LandlordId,
    LandlordProfile
  >;

  return (
    <form action={saveLandlordAddresses} className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-border">
      <div>
        <h2 className="text-lg text-ink">Landlord addresses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Printed on that landlord’s invoice, under their name. Leave blank until
          the address is real — empty lines are not printed, and nothing is made up.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {LANDLORD_IDS.map((id) => {
          const landlord = byId[id];
          const lines = addressLines(landlord?.address);
          return (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={`address_${id}`}>{LANDLORD_NAMES[id]}</Label>
              <Textarea
                id={`address_${id}`}
                name={`address_${id}`}
                rows={4}
                defaultValue={landlord?.address ?? ""}
                placeholder={"Line 1\nTown\nPostcode"}
                className="min-h-28 bg-cream/40 font-normal"
              />
              {lines.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No address on file. Invoices will show the name only.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <Button type="submit">Save addresses</Button>
    </form>
  );
}
