import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton() {
  return (
    <form method="POST" action="/api/auth/logout">
      <button type="submit" className={cn(buttonVariants({ variant: "ghost" }))}>
        Sign out
      </button>
    </form>
  );
}
