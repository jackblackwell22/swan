"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const alwaysLinks = [
  { href: "/", label: "Home" },
  { href: "/the-garages", label: "The garages" },
  { href: "/location", label: "Location" },
] as const;

const tenantLink = { href: "/for-tenants", label: "For tenants" } as const;
const enquireLink = { href: "/enquire", label: "Enquire" } as const;

export function SiteHeader({
  businessName,
  acceptingEnquiries,
}: {
  businessName: string;
  acceptingEnquiries: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = acceptingEnquiries
    ? [...alwaysLinks, enquireLink, tenantLink]
    : [...alwaysLinks, tenantLink];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 overflow-hidden rounded-sm border border-brick/30 bg-brick"
          >
            <span className="flex-1 bg-door" />
            <span className="w-px bg-stone" />
            <span className="flex-1 bg-door" />
          </span>
          <span className="leading-tight">
            <span className="block font-[family-name:var(--font-heading)] text-lg text-ink">
              {businessName}
            </span>
            <span className="block text-xs tracking-wide text-muted-foreground uppercase">
              Leamington Spa
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white text-door"
                    : "text-ink/80 hover:bg-white/70 hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <nav className="border-t border-border bg-cream px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2.5 text-base text-ink hover:bg-white"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
