"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateInvoiceForTenant } from "@/app/admin/actions";

export function GenerateInvoiceButton({ tenantId }: { tenantId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");

  return (
    <div className="text-right">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await generateInvoiceForTenant(tenantId);
            if (result.error) {
              setNote(result.error);
              return;
            }
            setNote(result.summary || result.invoiceNumber || "Done.");
            if (result.count === 1 && result.invoiceId) {
              router.push(`/admin/invoices/${result.invoiceId}`);
            }
            router.refresh();
          })
        }
      >
        Invoice this month
      </Button>
      {note ? <p className="mt-1 max-w-sm text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
