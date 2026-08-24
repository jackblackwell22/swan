import Image from "next/image";

export function SitePhoto({
  caption,
  priority = false,
}: {
  caption?: string;
  priority?: boolean;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
      <Image
        src="/images/swan-street-lock-ups.png"
        alt="The Swan Street lock-up garages: a brick row of bright blue wooden double doors in Royal Leamington Spa."
        width={1536}
        height={1024}
        priority={priority}
        className="h-auto w-full object-cover"
      />
      {caption ? (
        <figcaption className="px-4 py-3 text-sm text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
