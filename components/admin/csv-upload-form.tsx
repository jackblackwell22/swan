"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadStatementAction } from "@/app/admin/actions";

export function CsvUploadForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-border"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await uploadStatementAction(form);
          if (result.error) {
            setMessage(result.error);
            return;
          }
          setMessage(
            `Read ${result.total} incoming rows. Auto-marked paid: ${result.autoPaid}. Suggested matches to confirm: ${result.suggested}.`,
          );
          router.push(`/admin/payments?batch=${result.batchId}`);
          router.refresh();
        });
      }}
    >
      <Label htmlFor="csv">Bank statement CSV</Label>
      <p className="text-xs text-muted-foreground">
        A typical UK export with columns for date, description and amount (or “Paid in” /
        “Money in”). Only incoming payments are read. We never store tenant bank account numbers.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Input id="csv" name="csv" type="file" accept=".csv,text/csv" required className="max-w-sm bg-cream/40" />
        <Button type="submit" disabled={pending}>
          {pending ? "Matching…" : "Upload and match"}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
