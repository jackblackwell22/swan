import type { Metadata } from "next";
import { OsmMap } from "@/components/OsmMap";
import { SITE_PLACE, SITE_POSTCODE_AREA, SITE_STREET } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Location",
};

export default function LocationPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Location</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        The lock-ups are on {SITE_STREET} in {SITE_PLACE}, postcode area{" "}
        {SITE_POSTCODE_AREA}. The map below is OpenStreetMap, with a pin on the
        street itself — not on a made-up unit.
      </p>
      <div className="mt-8">
        <OsmMap />
      </div>
      <p className="mt-6 max-w-2xl text-muted">
        Swan Street is a short residential street in the north of the town.
        Please do not park in front of the doors: they need to stay clear for
        the people who rent them.
      </p>
    </div>
  );
}
