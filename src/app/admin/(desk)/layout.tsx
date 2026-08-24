import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionOwner, ownerDisplayName, requireOwner } from "@/lib/auth";
import { logoutAction } from "../actions";

const nav = [
  { href: "/admin", label: "This month" },
  { href: "/admin/garages", label: "Garages" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await getSessionOwner();
  if (!owner) redirect("/admin/login");
  await requireOwner();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b-4 border-brick bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl text-door">Owners’ desk</p>
            <p className="text-sm text-muted">Signed in as {ownerDisplayName(owner)}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm font-semibold text-brick hover:underline">
              Sign out
            </button>
          </form>
        </div>
        <nav
          aria-label="Owners’ desk"
          className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-4 pb-4 text-sm font-semibold"
        >
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-ink hover:text-door">
              {item.label}
            </Link>
          ))}
          <Link href="/" className="text-muted hover:text-door">
            Public site
          </Link>
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
