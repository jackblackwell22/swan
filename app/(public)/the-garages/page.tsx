import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isAcceptingEnquiries } from "@/lib/db";
import { ALL_LET_BODY } from "@/lib/enquiries";

export const metadata: Metadata = {
  title: "The garages",
};

export default function GaragesPage() {
  const accepting = isAcceptingEnquiries();
  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brick uppercase">
        Swan Street
      </p>
      <h1 className="mt-2 text-4xl text-ink sm:text-5xl">The garages</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink/80">
        These are traditional British lock-ups, not a self-storage warehouse.
        The photograph on this page is the site itself.
      </p>

      <figure className="relative mt-10 aspect-[16/9] overflow-hidden rounded-xl bg-stone ring-1 ring-border">
        <Image
          src="/images/lock-ups.jpg"
          alt="A row of lock-up garages with bright blue wooden double doors in a reddish-brown brick wall"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1152px) 1152px, 100vw"
        />
      </figure>
      <p className="mt-3 text-sm text-muted-foreground">
        Bright blue wooden double doors, silver strap hinges and padlocks,
        STRICTLY NO PARKING signs, folding bollards on the forecourt, and the
        brick buildings of Leamington behind.
      </p>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl text-ink">What you can see</h2>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-ink/80">
            <li>
              Side-hinged wooden double doors, painted a strong blue, with
              galvanised strap hinges and a padlock at the meeting of each pair.
            </li>
            <li>
              A single-storey brick wall in warm reddish-brown, with a pale
              coping along the top.
            </li>
            <li>
              A concrete forecourt, a drainage channel, and folding metal
              bollards (shown folded down in the photograph).
            </li>
            <li>
              Double yellow lines on the carriageway. The signs on the doors
              read STRICTLY NO PARKING — the forecourt is not a parking bay.
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-2xl text-ink">How they are used</h2>
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            There are six lock-ups, numbered 7, 8, 9, 10, 11 and 12. Tenants use
            them in the ordinary way: a vehicle, storage for a small business, or
            private lock-up space. We do not publish a count of vacancies, or a
            rent list on this website, because those figures change
            {accepting
              ? " and we would rather tell you plainly when you enquire."
              : "."}
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            The photograph shows a short row of units on the street. That is
            the scale of the place — a local, family-run tenancy rather than a
            branded storage centre.
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <figure className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-border">
          <Image
            src="/images/lock-ups.jpg"
            alt="Blue doors and brick piers"
            fill
            className="object-cover object-[15%_70%]"
            sizes="(min-width: 640px) 30vw, 100vw"
          />
        </figure>
        <figure className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-border">
          <Image
            src="/images/lock-ups.jpg"
            alt="No parking signs on the garage doors"
            fill
            className="object-cover object-center"
            sizes="(min-width: 640px) 30vw, 100vw"
          />
        </figure>
        <figure className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-border">
          <Image
            src="/images/lock-ups.jpg"
            alt="The street in front of the lock-ups, with double yellow lines"
            fill
            className="object-cover object-[85%_80%]"
            sizes="(min-width: 640px) 30vw, 100vw"
          />
        </figure>
      </div>

      <div className="mt-12 rounded-xl bg-white/70 p-6 ring-1 ring-border sm:p-8">
        <h2 className="text-2xl text-ink">Availability and rent</h2>
        <p className="mt-3 max-w-2xl text-base text-ink/80">
          {accepting
            ? "If a unit is free, or likely to become free, we will say so when we reply. Rent is agreed with you directly. Nothing on this site should be read as an offer of a particular unit or a particular figure."
            : ALL_LET_BODY}
        </p>
        {accepting ? (
          <Button render={<Link href="/enquire" />} className="mt-5 h-10 px-4">
            Enquire
          </Button>
        ) : null}
      </div>
    </article>
  );
}
