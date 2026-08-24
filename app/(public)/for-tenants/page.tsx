import type { Metadata } from "next";
import Link from "next/link";
import { getBusinessConfig, hasBankDetails } from "@/lib/config";

export const metadata: Metadata = {
  title: "For tenants",
};

export default function ForTenantsPage() {
  const config = getBusinessConfig();
  const bank = hasBankDetails(config);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brick uppercase">
        Practical notes
      </p>
      <h1 className="mt-2 text-4xl text-ink sm:text-5xl">For tenants</h1>
      <p className="mt-4 text-lg text-ink/80">
        A few practical points for people who already have a unit, or are about
        to take one. This is not a tenancy agreement, and it is not legal
        advice — just how we usually do things.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl text-ink">Paying rent</h2>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          Rent is due by bank transfer. Each invoice has its own payment
          reference in the form{" "}
          <span className="font-mono text-sm">SWAN-unit-MONYY</span> — for
          example, unit 4 in September 2026 would be{" "}
          <span className="font-mono text-sm">SWAN-4-SEP26</span>. Please put
          that reference on the transfer in full. It is how we match your
          payment to the right invoice.
        </p>
        {bank ? (
          <div className="mt-4 rounded-lg bg-white p-4 text-sm ring-1 ring-border">
            <p>
              <span className="text-muted-foreground">Account name</span>
              <br />
              {config.name}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Sort code</span>
              <br />
              {config.sortCode}
            </p>
            <p className="mt-2">
              <span className="text-muted-foreground">Account number</span>
              <br />
              {config.accountNumber}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            Bank details are printed on your invoice when we have them set up,
            or we will give them to you directly.
          </p>
        )}
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          Invoices are raised at the start of the month. If email is working on
          our side, a copy comes to the address we have for you, with a PDF.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl text-ink">The forecourt</h2>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          The signs on the doors say STRICTLY NO PARKING, and the road in front
          has double yellow lines. Please do not leave a vehicle on the
          forecourt except while you are loading or opening up. The folding
          bollards are there for the street, not as parking bays.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl text-ink">Access and keys</h2>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          Access is by the key or padlock arranged with us when you take the
          unit. We have not put opening hours on this website because the
          lock-ups are not a staffed depot — if you need to collect a spare key,
          or something is stuck, get in touch and we will sort it out as a
          family business does.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl text-ink">If something is wrong</h2>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          Doors, hinges, padlocks and the brickwork are our lookout when they
          fail in ordinary use. Tell us promptly. We would rather hear about a
          sticking hinge than find it later.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          Please keep the unit for the use we agreed. If your circumstances
          change, write to us — we can usually be practical.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl text-ink">Contact</h2>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          {config.email || config.phone ? (
            <>
              {config.email ? (
                <>
                  Email{" "}
                  <a className="text-door underline-offset-2 hover:underline" href={`mailto:${config.email}`}>
                    {config.email}
                  </a>
                </>
              ) : null}
              {config.email && config.phone ? ", or telephone " : null}
              {config.phone && !config.email ? "Telephone " : null}
              {config.phone ? config.phone : null}. You can also use the{" "}
              <Link href="/enquire" className="text-door underline-offset-2 hover:underline">
                enquiry form
              </Link>
              .
            </>
          ) : (
            <>
              Use the{" "}
              <Link href="/enquire" className="text-door underline-offset-2 hover:underline">
                enquiry form
              </Link>{" "}
              and we will reply from the address we have on file for you, or
              with a new message if you are not yet a tenant.
            </>
          )}
        </p>
      </section>
    </article>
  );
}
