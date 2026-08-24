import type { Metadata } from "next";
import { EnquireCta } from "@/components/EnquireCta";
import { SitePhoto } from "@/components/SitePhoto";
import { GARAGE_UNITS } from "@/lib/constants";
import { isAcceptingEnquiries } from "@/lib/settings";

export const metadata: Metadata = {
  title: "The garages",
};

export default function GaragesPage() {
  const accepting = isAcceptingEnquiries();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">The garages</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Units {GARAGE_UNITS.join(", ")} are lock-up garages on Swan Street. Each
        unit has a pair of wooden double doors in the original brick building.
        Jack Blackwell and David Blackwell let them; which of them owns which
        unit is recorded on the owners’ desk, not guessed here.
      </p>

      <div className="mt-8">
        <SitePhoto caption="A row of the Swan Street lock-ups, photographed on the street." />
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GARAGE_UNITS.map((unit) => (
          <li
            key={unit}
            className="rounded-lg border border-line bg-paper px-5 py-6"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-brick">
              Lock-up
            </p>
            <p className="mt-1 font-display text-3xl text-door">{unit}</p>
            <p className="mt-2 text-sm text-muted">
              Traditional lock-up garage on Swan Street.
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {accepting ? (
          <EnquireCta accepting />
        ) : (
          <p className="max-w-2xl rounded-md border border-line bg-paper px-4 py-3 text-muted">
            Every lock-up is let at the moment, so we are not taking new
            enquiries.
          </p>
        )}
      </div>
    </div>
  );
}
