import { EnquireCta } from "@/components/EnquireCta";
import { SitePhoto } from "@/components/SitePhoto";
import { GARAGE_UNITS, SITE_PLACE, SITE_STREET } from "@/lib/constants";
import { isAcceptingEnquiries } from "@/lib/settings";

export default function HomePage() {
  const accepting = isAcceptingEnquiries();
  const lastUnit = GARAGE_UNITS[GARAGE_UNITS.length - 1];

  return (
    <div>
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brick">
              {SITE_STREET}, {SITE_PLACE}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Lock-up garages, looked after by the family who owns them.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Swan Street Lock-Ups is a short row of traditional brick lock-ups
              on Swan Street in Royal Leamington Spa. The landlords are Jack
              Blackwell and David Blackwell. Units {GARAGE_UNITS[0]} to {lastUnit}{" "}
              are the garages on this site.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <EnquireCta accepting={accepting} />
              <a
                href="/garages"
                className="inline-flex rounded-md border border-door px-5 py-3 font-semibold text-door hover:bg-cream"
              >
                See the garages
              </a>
            </div>
            {!accepting ? (
              <p className="mt-6 max-w-xl rounded-md border border-line bg-cream px-4 py-3 text-sm text-muted">
                Every lock-up is let at the moment, so we are not taking new
                enquiries. Please check back another time.
              </p>
            ) : null}
          </div>
          <SitePhoto
            priority
            caption="The lock-ups on Swan Street: bright blue wooden doors in the original brick."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 md:grid-cols-3">
          <article className="rounded-lg border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">On Swan Street</h2>
            <p className="mt-3 text-muted">
              The garages sit on Swan Street in Royal Leamington Spa, postcode
              area CV32. The map on our location page pins the street, not a
              made-up unit number.
            </p>
            <a href="/location" className="mt-4 inline-block font-semibold text-door hover:underline">
              Find us
            </a>
          </article>
          <article className="rounded-lg border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">Six lock-ups</h2>
            <p className="mt-3 text-muted">
              This website covers units {GARAGE_UNITS.join(", ")}. They are
              ordinary lock-up garages with wooden double doors — not a
              self-storage warehouse.
            </p>
            <a href="/garages" className="mt-4 inline-block font-semibold text-door hover:underline">
              The garages
            </a>
          </article>
          <article className="rounded-lg border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">If you already rent</h2>
            <p className="mt-3 text-muted">
              Rent is invoiced by Jack or David for the lock-ups they each let.
              Pay by bank transfer using the reference printed on the invoice.
            </p>
            <a href="/tenants" className="mt-4 inline-block font-semibold text-door hover:underline">
              For tenants
            </a>
          </article>
        </div>
      </section>
    </div>
  );
}
