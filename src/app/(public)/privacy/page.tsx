import type { Metadata } from "next";
import { SITE_NAME, SITE_PLACE, SITE_STREET } from "@/lib/constants";
import { isAcceptingEnquiries } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  const accepting = isAcceptingEnquiries();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Privacy</h1>
      <p className="mt-4 text-lg text-muted">
        {SITE_NAME} is a family-run lock-up site. The lock-ups are on{" "}
        {SITE_STREET}, {SITE_PLACE}.
      </p>
      <h2 className="mt-8 font-display text-2xl">What we keep</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
        <li>
          Messages sent through the enquiry form: your name, message, and any
          email or phone number you choose to leave.
        </li>
        <li>
          If you rent a lock-up: your name, the units you rent, the rent for
          each, and an email address if one is given, so invoices can be made
          and sent.
        </li>
        <li>Copies of invoices we generate.</li>
      </ul>
      <h2 className="mt-8 font-display text-2xl">Where it is stored</h2>
      <p className="mt-3 text-muted">
        Records are stored in a database file on the computer that hosts this
        website. They are not sold. There are no payment companies, mailing
        services, or advertising networks attached to this site.
      </p>
      <h2 className="mt-8 font-display text-2xl">Asking about your information</h2>
      <p className="mt-3 text-muted">
        {accepting
          ? "Use the enquiry form if you want to know what we hold, or to ask us to update it."
          : "Write in the usual way you already use, as the enquiry form is closed while every lock-up is let."}
      </p>
    </div>
  );
}
