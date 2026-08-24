import { OSM, SITE_PLACE, SITE_STREET } from "@/lib/constants";

const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${OSM.minLon}%2C${OSM.minLat}%2C${OSM.maxLon}%2C${OSM.maxLat}&layer=mapnik&marker=${OSM.lat}%2C${OSM.lon}`;
const openSrc = `https://www.openstreetmap.org/?mlat=${OSM.lat}&mlon=${OSM.lon}#map=18/${OSM.lat}/${OSM.lon}`;

export function OsmMap({ title }: { title?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
      <iframe
        title={title ?? `OpenStreetMap of ${SITE_STREET}, ${SITE_PLACE}`}
        src={embedSrc}
        className="h-[28rem] w-full border-0"
        loading="lazy"
      />
      <p className="px-4 py-3 text-sm text-muted">
        Pin on {SITE_STREET}, not a particular unit.{" "}
        <a
          href={openSrc}
          className="font-semibold text-door hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Open a larger map
        </a>
        . Map ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap contributors
        </a>
        .
      </p>
    </div>
  );
}
