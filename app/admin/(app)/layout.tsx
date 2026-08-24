import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getBusinessConfig } from "@/lib/config";
import { refreshOverdueStatuses } from "@/lib/db";
import { londonDateISO } from "@/lib/format";
import { EmailBanner } from "@/components/admin/email-banner";
import { LogoutButton } from "@/components/admin/logout-button";

const links = [
  { href: "/admin", label: "This month" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const config = getBusinessConfig();
  refreshOverdueStatuses(londonDateISO());

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-lg text-ink">
              {config.name}
            </p>
            <p className="text-xs text-muted-foreground">Signed in as {session.email}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-ink/80 hover:bg-cream hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <EmailBanner />
        {children}
      </div>
    </div>
  );
}
