import Link from "next/link";

export function EnquireCta({
  accepting,
  compact = false,
}: {
  accepting: boolean;
  compact?: boolean;
}) {
  if (!accepting) return null;
  return (
    <Link
      href="/enquire"
      className={
        compact
          ? "inline-flex rounded-md bg-door px-4 py-2 text-sm font-semibold text-white hover:bg-door-dark"
          : "inline-flex rounded-md bg-door px-5 py-3 font-semibold text-white hover:bg-door-dark"
      }
    >
      Enquire about a lock-up
    </Link>
  );
}
