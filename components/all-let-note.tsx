import { ALL_LET_BODY, ALL_LET_HEADING } from "@/lib/enquiries";
import { cn } from "@/lib/utils";

export function AllLetNote({
  className,
  heading = ALL_LET_HEADING,
}: {
  className?: string;
  heading?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-white p-6 ring-1 ring-border sm:p-8", className)}>
      <h2 className="text-2xl text-ink">{heading}</h2>
      <p className="mt-3 text-base text-ink/80">{ALL_LET_BODY}</p>
    </div>
  );
}
