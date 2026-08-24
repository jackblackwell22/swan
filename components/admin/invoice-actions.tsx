"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  markPaidAction,
  markSentManually,
  sendInvoiceAction,
} from "@/app/admin/actions";

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

  return (
    <div className={compact ? "flex flex-wrap justify-end gap-1" : "flex flex-wrap gap-2"}>
      <Button
        size="sm"
        variant="outline"
        render={<a href={`/api/admin/invoices/${invoiceId}/pdf`} />}
      >
        PDF
      </Button>
      {status !== "paid" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markPaidAction(invoiceId);
              router.refresh();
            })
          }
        >
          Mark paid
        </Button>
      ) : null}
      {status === "draft" ? (
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
                setMessage("Invoice emailed.");
                router.refresh();
              }
            })
          }
        >
          Email
        </Button>
      ) : status !== "paid" ? (
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
                setMessage("Invoice emailed again.");
                router.refresh();
              }
            })
          }
        >
          Resend
        </Button>
      ) : null}
      {status === "draft" && !compact ? (
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
