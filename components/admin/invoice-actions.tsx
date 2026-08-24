"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markSentManually, sendInvoiceAction } from "@/app/admin/actions";

export function InvoiceActions({
  invoiceId,
  status,
  compact = false,
}: {
  invoiceId: number;
  status: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const drafted = status === "draft";

  return (
    <div className={compact ? "flex flex-wrap justify-end gap-1" : "flex flex-wrap gap-2"}>
      <Button
        size="sm"
        variant="outline"
        render={<a href={`/api/admin/invoices/${invoiceId}/pdf`} />}
      >
        PDF
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await sendInvoiceAction(invoiceId);
            if (result && "error" in result && result.error) {
              setMessage(result.error);
            } else {
              setMessage(drafted ? "Invoice emailed." : "Invoice emailed again.");
              router.refresh();
            }
          })
        }
      >
        {drafted ? "Email" : "Resend"}
      </Button>
      {drafted && !compact ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markSentManually(invoiceId);
              router.refresh();
            })
          }
        >
          Mark sent
        </Button>
      ) : null}
      {message ? (
        <p className="basis-full text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
