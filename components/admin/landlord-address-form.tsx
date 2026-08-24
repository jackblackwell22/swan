import { saveLandlordDetails } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LANDLORD_IDS, LANDLORD_NAMES, addressLines, bacsLines } from "@/lib/landlords";
import type { LandlordId, LandlordProfile } from "@/lib/config";

export function LandlordAddressForm({ landlords }: { landlords: LandlordProfile[] }) {
  const byId = Object.fromEntries(landlords.map((landlord) => [landlord.id, landlord])) as Record<
    LandlordId,
    LandlordProfile
  >;

  return (
    <form action={saveLandlordDetails} className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-border">
      <div>
        <h2 className="text-lg text-ink">Landlord addresses and BACS</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Printed on that landlord’s invoice. Leave a field blank until it is real
          — empty sort codes, account numbers and address lines are not printed,
          and nothing is made up.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {LANDLORD_IDS.map((id) => {
          const landlord = byId[id];
          const lines = addressLines(landlord?.address);
          const bacs = landlord ? bacsLines(landlord) : [];
          return (
            <div key={id} className="space-y-3">
              <p className="font-medium text-ink">{LANDLORD_NAMES[id]}</p>
              <div className="space-y-1.5">
                <Label htmlFor={`address_${id}`}>Postal address</Label>
                <Textarea
                  id={`address_${id}`}
                  name={`address_${id}`}
                  rows={4}
                  defaultValue={landlord?.address ?? ""}
                  placeholder="Leave blank until the real address is known"
                  className="min-h-28 bg-cream/40 font-normal"
                />
                {lines.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No address on file. Invoices will show the name only.
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`account_name_${id}`}>Account name</Label>
                <Input
                  id={`account_name_${id}`}
                  name={`account_name_${id}`}
                  defaultValue={landlord?.accountName ?? ""}
                  placeholder="Leave blank until known"
                  className="h-10 bg-cream/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`sort_code_${id}`}>Sort code</Label>
                <Input
                  id={`sort_code_${id}`}
                  name={`sort_code_${id}`}
                  defaultValue={landlord?.sortCode ?? ""}
                  placeholder="Leave blank until known"
                  className="h-10 bg-cream/40"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`account_number_${id}`}>Account number</Label>
                <Input
                  id={`account_number_${id}`}
                  name={`account_number_${id}`}
                  defaultValue={landlord?.accountNumber ?? ""}
                  placeholder="Leave blank until known"
                  className="h-10 bg-cream/40"
                  autoComplete="off"
                />
              </div>
              {bacs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No BACS details on file. The invoice will still show the payment
                  reference.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <Button type="submit">Save addresses and BACS</Button>
    </form>
  );
}
