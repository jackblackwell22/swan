"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmMatchAction } from "@/app/admin/actions";

export function ConfirmMatchButton({ rowId }: { rowId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await confirmMatchAction(rowId);
          router.refresh();
        })
      }
    >
      Confirm paid
    </Button>
  );
}
