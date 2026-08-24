"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTenant } from "@/app/admin/actions";
import type { Tenant } from "@/lib/db";

const initial = { error: "" };

export function TenantForm({ tenant }: { tenant?: Tenant }) {
  const [state, action, pending] = useActionState(
    async (_prev: { error: string }, formData: FormData) => {
      const result = await saveTenant(formData);
      return result ?? { error: "" };
    },
    initial,
  );

  const rentDefault = tenant
    ? (tenant.monthly_rent_pence / 100).toFixed(2)
    : "";

  return (
    <form action={action} className="max-w-xl space-y-4 rounded-xl bg-white p-6 ring-1 ring-border">
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="unit_label">Unit label</Label>
          <Input
            id="unit_label"
            name="unit_label"
            required
            placeholder="e.g. 1, 2, A"
            defaultValue={tenant?.unit_label}
            className="h-10 bg-cream/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthly_rent">Monthly rent (£)</Label>
          <Input
            id="monthly_rent"
            name="monthly_rent"
            required
            inputMode="decimal"
            defaultValue={rentDefault}
            className="h-10 bg-cream/40"
          />
        </div>
      </div>
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
