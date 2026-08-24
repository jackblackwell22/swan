"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setAcceptingEnquiriesAction } from "@/app/admin/actions";
import { Switch } from "@/components/ui/switch";

export function AcceptingEnquiriesToggle({ accepting }: { accepting: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(accepting);
  const [pending, start] = useTransition();

  useEffect(() => {
    setOn(accepting);
  }, [accepting]);

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium text-ink">
            <label htmlFor="accepting-enquiries" className="cursor-pointer">
              Accepting enquiries
            </label>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {on
              ? "The public site shows the enquiry form."
              : "Public enquiry form is closed."}
          </p>
        </div>
        <Switch
          id="accepting-enquiries"
          checked={on}
          disabled={pending}
          aria-label="Accepting enquiries"
          onCheckedChange={(checked) => {
            const next = Boolean(checked);
            setOn(next);
            start(async () => {
              await setAcceptingEnquiriesAction(next);
              router.refresh();
            });
          }}
        />
      </div>
    </div>
  );
}
