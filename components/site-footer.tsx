import Link from "next/link";
import type { BusinessConfig } from "@/lib/config";

export function SiteFooter({ config }: { config: BusinessConfig }) {
  const contacts = [config.email, config.phone].filter(Boolean);

  return (
    <footer className="mt-auto border-t border-border bg-stone/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-heading)] text-xl text-ink">
            {config.name}
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            A small, family-run row of lock-up garages on Swan Street, Royal
            Leamington Spa. Father and son, looking after units for local
            businesses and private tenants.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-brick uppercase">
            Find us
          </p>
          <p className="mt-2 text-sm text-ink">
            Swan Street
            <br />
            Royal Leamington Spa
            <br />
            Warwickshire
            <br />
            CV32
          </p>
          {config.address ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Correspondence: {config.address}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-brick uppercase">
            Get in touch
          </p>
          {contacts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm">
              {config.email ? (
                <li>
                  <a className="text-door underline-offset-2 hover:underline" href={`mailto:${config.email}`}>
                    {config.email}
                  </a>
                </li>
              ) : null}
              {config.phone ? (
                <li>
                  <a className="text-door underline-offset-2 hover:underline" href={`tel:${config.phone.replace(/\s+/g, "")}`}>
                    {config.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Use the{" "}
              <Link href="/enquire" className="text-door underline-offset-2 hover:underline">
                enquiry form
              </Link>{" "}
              and we will come back to you.
            </p>
          )}
          <p className="mt-4 text-sm">
            <Link href="/privacy" className="text-muted-foreground underline-offset-2 hover:underline">
              Privacy
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-3 text-center text-[11px] text-muted-foreground/80">
        <Link href="/admin/login" className="hover:text-ink">
          Owners
        </Link>
      </div>
    </footer>
  );
}
