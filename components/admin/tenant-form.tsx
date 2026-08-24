"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTenant } from "@/app/admin/actions";
import { GARAGE_NUMBERS, LANDLORD_NAMES, isLandlordId } from "@/lib/landlords";
import type { Garage, Tenant, TenantGarage } from "@/lib/db";

const initial = { error: "" };

type GarageRow = Garage & { tenant_name: string | null; tenant_id: number | null };

export function TenantForm({
  tenant,
  assignments = [],
  garages,
}: {
  tenant?: Tenant;
  assignments?: TenantGarage[];
  garages: GarageRow[];
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error: string }, formData: FormData) => {
      const result = await saveTenant(formData);
      return result ?? { error: "" };
    },
    initial,
  );

  const assigned = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of assignments) {
      map.set(row.garage_number, row.rent_pence);
    }
    return map;
  }, [assignments]);

  const [checked, setChecked] = useState<Record<number, boolean>>(() => {
    const start: Record<number, boolean> = {};
    for (const number of GARAGE_NUMBERS) {
      start[number] = assigned.has(number);
    }
    return start;
  });

  return (
    <form action={action} className="max-w-2xl space-y-4 rounded-xl bg-white p-6 ring-1 ring-border">
      {tenant ? <input type="hidden" name="id" value={tenant.id} /> : null}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={tenant?.name} className="h-10 bg-cream/40" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={tenant?.email}
          className="h-10 bg-cream/40"
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Garages (7–12)</legend>
        <p className="text-xs text-muted-foreground">
          Tick every lock-up this tenant rents. Enter rent per garage so the invoice can
          show a line for each. A garage can only be let to one active tenant at a time.
        </p>
        <div className="space-y-2">
          {garages.map((garage) => {
            const occupiedByOther =
              garage.tenant_id != null && garage.tenant_id !== tenant?.id;
            const landlordLabel = isLandlordId(garage.landlord_id)
              ? LANDLORD_NAMES[garage.landlord_id]
              : "landlord not set yet";
            const rentDefault = assigned.has(garage.number)
              ? (assigned.get(garage.number)! / 100).toFixed(2)
              : "";
            return (
              <div
                key={garage.number}
                className="flex flex-col gap-2 rounded-lg bg-cream/40 p-3 sm:flex-row sm:items-center"
              >
                <label className="flex min-w-[9rem] items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="garages"
                    value={garage.number}
                    disabled={occupiedByOther}
                    checked={occupiedByOther ? false : checked[garage.number]}
                    onChange={(event) =>
                      setChecked((prev) => ({
                        ...prev,
                        [garage.number]: event.target.checked,
                      }))
                    }
                    className="size-4 accent-door"
                  />
                  Garage {garage.number}
                </label>
                <Input
                  name={`rent_${garage.number}`}
                  inputMode="decimal"
                  placeholder="Rent £"
                  defaultValue={rentDefault}
                  disabled={occupiedByOther || !checked[garage.number]}
                  required={checked[garage.number] && !occupiedByOther}
                  className="h-9 max-w-[9rem] bg-white"
                  aria-label={`Monthly rent for garage ${garage.number}`}
                />
                <p className="text-xs text-muted-foreground">
                  {occupiedByOther
                    ? `Already let to ${garage.tenant_name}`
                    : landlordLabel}
                </p>
              </div>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tenant_type">Tenant type</Label>
          <select
            id="tenant_type"
            name="tenant_type"
            defaultValue={tenant?.tenant_type ?? "private"}
            className="h-10 w-full rounded-md border border-input bg-cream/40 px-3 text-sm"
          >
            <option value="private">Private</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={tenant?.status ?? "active"}
            className="h-10 w-full rounded-md border border-input bg-cream/40 px-3 text-sm"
          >
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="h-10" disabled={pending}>
        {pending ? "Saving…" : tenant ? "Save tenant" : "Add tenant"}
      </Button>
    </form>
  );
}
