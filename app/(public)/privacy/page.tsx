import type { Metadata } from "next";
import Link from "next/link";
import { getBusinessConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  const config = getBusinessConfig();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl text-ink sm:text-5xl">Privacy</h1>
      <p className="mt-4 text-base leading-relaxed text-ink/80">
        A short note on how {config.name} handles personal information. We are
        a small family business in England, not a marketing company.
      </p>

      <h2 className="mt-10 text-2xl text-ink">Who we are</h2>
      <p className="mt-3 text-base leading-relaxed text-ink/80">
        {config.name}, lock-up garages on Swan Street, Royal Leamington Spa,
        Warwickshire.
        {config.email ? (
          <>
            {" "}
            You can write to us at{" "}
            <a className="text-door underline-offset-2 hover:underline" href={`mailto:${config.email}`}>
              {config.email}
            </a>
            .
          </>
        ) : (
          <>
            {" "}
            You can write to us using the{" "}
            <Link href="/enquire" className="text-door underline-offset-2 hover:underline">
              enquiry form
            </Link>
            .
          </>
        )}
      </p>

      <h2 className="mt-10 text-2xl text-ink">What we keep</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-ink/80">
        <li>
          Enquiries sent through this website: your name, email, telephone if
          you give it, whether you are a business or private tenant, intended
          use, and your message.
        </li>
        <li>
          Tenant records we need to run the tenancy: name, email, unit label,
          rent, and invoices. We do not store tenant bank account details.
        </li>
        <li>
          If you are one of the two owners, a login cookie and an authenticator
          secret so the admin pages stay private.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl text-ink">Why</h2>
      <p className="mt-3 text-base leading-relaxed text-ink/80">
        To answer enquiries, to invoice and record rent, and to keep the owners&apos;
        admin pages secure. We do not sell your details, and we do not use
        advertising or analytics cookies.
      </p>

      <h2 className="mt-10 text-2xl text-ink">Cookies</h2>
      <p className="mt-3 text-base leading-relaxed text-ink/80">
        The public pages do not set a tracking cookie. The owners&apos; login uses
        an httpOnly session cookie after they sign in.
      </p>

      <h2 className="mt-10 text-2xl text-ink">Keeping it</h2>
      <p className="mt-3 text-base leading-relaxed text-ink/80">
        Enquiry messages are kept so we can reply and remember who has been in
        touch. Tenant and invoice records are kept for as long as we need them
        to run the lock-ups and our accounts. If you would like an enquiry
        deleted, ask us.
      </p>

      <h2 className="mt-10 text-2xl text-ink">Your rights</h2>
      <p className="mt-3 text-base leading-relaxed text-ink/80">
        Under UK data protection law you can ask to see what we hold about you,
        to correct it, or (where it applies) to have it deleted. Write to us
        using the details above.
      </p>
    </article>
  );
}
