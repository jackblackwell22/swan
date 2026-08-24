import { GARAGE_UNITS } from "@/lib/constants";
import { poundsInputFromPence } from "@/lib/money";
import { listGarages } from "@/lib/queries";
import { saveTenantAction } from "../../actions";

export function TenantForm({
  tenant,
  error,
}: {
  tenant?: {
    id: number;
    name: string;
    email: string;
    notes: string;
    garages: { garage_unit: number; rent_pence: number }[];
  };
  error?: string;
}) {
  const occupancy = listGarages();
  const mine = new Map(
    (tenant?.garages ?? []).map((g) => [g.garage_unit, g.rent_pence]),
  );

  return (
    <form action={saveTenantAction} className="mt-6 space-y-5 rounded-lg border border-line bg-paper p-6">
      {tenant ? <input type="hidden" name="id" value={tenant.id} /> : null}
      {error ? (
        <p className="rounded-md bg-brick/10 px-4 py-3 text-sm text-brick-dark" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-semibold">Name</span>
        <input
          name="name"
          required
          defaultValue={tenant?.name}
          className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Email (for invoices)</span>
        <input
          name="email"
          type="email"
          defaultValue={tenant?.email}
          className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Notes (only you can see these)</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={tenant?.notes}
          className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">
          Lock-ups {GARAGE_UNITS[0]}–{GARAGE_UNITS[GARAGE_UNITS.length - 1]}
        </legend>
        <p className="mt-1 text-sm text-muted">
          Tick each lock-up this person rents and type the monthly rent. A
          lock-up already let to someone else cannot be ticked.
        </p>
        <ul className="mt-4 space-y-3">
          {occupancy.map((garage) => {
            const letToOther =
              garage.tenant_id != null && garage.tenant_id !== tenant?.id;
            const checked = mine.has(garage.unit);
            return (
              <li
                key={garage.unit}
                className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-cream px-3 py-3"
              >
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    name={`garage_${garage.unit}`}
                    defaultChecked={checked}
                    disabled={letToOther}
                    className="size-4 accent-door"
                  />
                  Unit {garage.unit}
                </label>
                {letToOther ? (
                  <span className="text-sm text-muted">
                    Let to {garage.tenant_name}
                  </span>
                ) : (
                  <label className="ml-auto flex items-center gap-2 text-sm">
                    Rent £
                    <input
                      name={`rent_${garage.unit}`}
                      inputMode="decimal"
                      defaultValue={
                        checked ? poundsInputFromPence(mine.get(garage.unit) ?? 0) : ""
                      }
                      className="w-28 rounded-md border border-line bg-paper px-2 py-1"
                    />
                    / month
                  </label>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>
      <button
        type="submit"
        className="rounded-md bg-door px-5 py-3 font-semibold text-white hover:bg-door-dark"
      >
        Save tenant
      </button>
    </form>
  );
}
