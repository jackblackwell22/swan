import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const links = [
  { href: "/", label: "Home" },
  { href: "/garages", label: "The garages" },
  { href: "/location", label: "Location" },
  { href: "/tenants", label: "For tenants" },
];

export function Header({
  acceptingEnquiries,
}: {
  acceptingEnquiries: boolean;
}) {
  return (
    <header className="border-b-4 border-brick bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-display text-xl text-door sm:text-2xl">
          {SITE_NAME}
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink hover:text-door">
              {link.label}
            </Link>
          ))}
          {acceptingEnquiries ? (
            <Link href="/enquire" className="text-door hover:text-door-dark">
              Enquire
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
