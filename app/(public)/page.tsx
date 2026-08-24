import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBusinessConfig } from "@/lib/config";

export default function HomePage() {
  const config = getBusinessConfig();

  return (
    <>
      <section className="relative min-h-[70vh] overflow-hidden bg-ink">
        <Image
          src="/images/lock-ups.jpg"
          alt="Blue wooden lock-up garage doors set in a reddish-brown brick wall on Swan Street, Leamington Spa"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6">
          <p className="text-sm tracking-[0.2em] text-white/80 uppercase">
            Swan Street · Royal Leamington Spa
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl text-white sm:text-5xl md:text-6xl">
            Lock-up garages, looked after locally
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
            A family-run row of traditional lock-ups for local businesses and
            private tenants. Father and son, on a quiet street in the spa town.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              render={<Link href="/enquire" />}
              size="lg"
              className="h-11 px-5 text-base"
            >
              Enquire about a unit
            </Button>
            <Button
              render={<Link href="/the-garages" />}
              size="lg"
              variant="outline"
              className="h-11 border-white/40 bg-white/10 px-5 text-base text-white hover:bg-white hover:text-ink"
            >
              See the garages
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-brick uppercase">
            Family-run
          </p>
          <h2 className="mt-2 text-3xl text-ink sm:text-4xl">
            A small concern, not a storage warehouse
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            {config.name} is a father-and-son lock-up tenancy on Swan Street.
            The units are the ones in the photograph: bright blue wooden double
            doors, warm brick, and the usual town-centre practicalities of
            padlocks, strap hinges and a no-parking forecourt.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            We let to a mix of local businesses and private tenants — a van
            kept off the street, stock for a shop, or simply somewhere dry to
            keep belongings. Availability and rent change as tenancies come and
            go, so please enquire rather than looking for a price list here.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="relative aspect-[4/5] overflow-hidden rounded-lg bg-stone ring-1 ring-border">
            <Image
              src="/images/lock-ups.jpg"
              alt="Close view of the blue double doors, silver strap hinges and padlocks"
              fill
              className="object-cover object-[18%_60%]"
              sizes="(min-width: 768px) 20vw, 50vw"
            />
          </figure>
          <figure className="relative mt-8 aspect-[4/5] overflow-hidden rounded-lg bg-stone ring-1 ring-border">
            <Image
              src="/images/lock-ups.jpg"
              alt="The brick lock-up wall with STRICTLY NO PARKING signs and folding bollards"
              fill
              className="object-cover object-[80%_40%]"
              sizes="(min-width: 768px) 20vw, 50vw"
            />
          </figure>
        </div>
      </section>

      <section className="border-y border-border bg-white/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <h3 className="text-xl text-ink">For businesses</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              A lock-up on the street, useful if you work in or around
              Leamington and need a unit close to town rather than an industrial
              estate.
            </p>
          </div>
          <div>
            <h3 className="text-xl text-ink">For private tenants</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              Vehicle storage or general lock-up use, by arrangement. We do not
              publish a waiting list online; write to us and we will tell you
              what is available.
            </p>
          </div>
          <div>
            <h3 className="text-xl text-ink">On Swan Street</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              Royal Leamington Spa, Warwickshire, in the CV32 area. The map is
              on the location page — we pin the street, not a made-up door
              number.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl text-ink">If you need a unit</h2>
        <p className="mt-3 text-base text-ink/80">
          Tell us a little about yourself and what you would use the garage
          for. We will come back to you about availability and rent.
        </p>
        <Button
          render={<Link href="/enquire" />}
          size="lg"
          className="mt-6 h-11 px-6 text-base"
        >
          Send an enquiry
        </Button>
      </section>
    </>
  );
}
