import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location",
};

const LAT = 52.2928;
const LNG = -1.53084;
const BBOX = "-1.5348,52.2911,-1.5269,52.2945";

export default function LocationPage() {
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(BBOX)}&layer=mapnik&marker=${LAT}%2C${LNG}`;
  const larger = `https://www.openstreetmap.org/?mlat=${LAT}&mlon=${LNG}#map=18/${LAT}/${LNG}`;

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brick uppercase">
        Warwickshire
      </p>
      <h1 className="mt-2 text-4xl text-ink sm:text-5xl">Location</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink/80">
        The lock-ups are on Swan Street, Royal Leamington Spa, in the CV32 area
        of Warwickshire. The pin on the map marks the street, not a particular
        unit number.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl ring-1 ring-border">
        <iframe
          title="OpenStreetMap of Swan Street, Royal Leamington Spa"
          src={embed}
          className="h-[420px] w-full border-0 bg-stone"
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Map data © OpenStreetMap contributors.{" "}
        <a
          href={larger}
          className="text-door underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Open a larger map
        </a>
        .
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl text-ink">Address</h2>
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            Swan Street
            <br />
            Royal Leamington Spa
            <br />
            Warwickshire
            <br />
            CV32
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            We have not put a door number on this page. If you are coming to
            view a unit, we will tell you how to find the right doors.
          </p>
        </div>
        <div>
          <h2 className="text-2xl text-ink">Getting there</h2>
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            Swan Street sits in the town, among the brick terraces typical of
            Leamington. There is no parking on the garage forecourt — the signs
            on the doors say so, and the road in front is marked with double
            yellow lines.
          </p>
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            If you already have a unit, please keep the forecourt clear for
            other tenants and for opening the doors.
          </p>
        </div>
      </div>
    </article>
  );
}
