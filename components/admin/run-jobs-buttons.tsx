"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runMonthlyAction, runRemindersAction } from "@/app/admin/actions";

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
            setNote(
              `Invoices: ${result.created.length} new, ${result.skipped.length} already there. Email ${result.smtp ? `sent for ${result.emailed}` : "not set up yet"}.`,
            );
            router.refresh();
          })
        }
      >
        Create this month&apos;s invoices
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await runRemindersAction();
            setNote(
              result.skipped
                ? "Reminders skipped — email is not set up yet."
                : `Reminders sent: ${result.sent7} at 7 days, ${result.sent14} at 14 days.`,
            );
            router.refresh();
          })
        }
      >
        Send reminders now
      </Button>
      {note ? <p className="basis-full text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
