"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runMonthlyAction } from "@/app/admin/actions";

export function RunJobsButtons() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await runMonthlyAction();
            const extra =
              result.errors && result.errors.length
                ? ` Not invoiced: ${result.errors.join(" ")}`
                : "";
            setNote(
              `Invoices: ${result.created.length} new, ${result.skipped.length} already there. Email ${result.smtp ? `sent for ${result.emailed}` : "not set up yet"}.${extra}`,
            );
            router.refresh();
          })
        }
      >
        Create this month&apos;s invoices
      </Button>
      {note ? <p className="basis-full text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
