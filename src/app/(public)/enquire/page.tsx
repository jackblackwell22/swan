import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { addEnquiry } from "@/lib/queries";
import { isAcceptingEnquiries } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Enquire",
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function submitEnquiry(formData: FormData) {
  "use server";
  if (!isAcceptingEnquiries()) {
    redirect("/enquire?closed=1");
  }
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !message) {
    redirect("/enquire?error=missing");
  }
  if (!email && !phone) {
    redirect("/enquire?error=contact");
  }
  if (email && !validEmail(email)) {
    redirect("/enquire?error=email");
  }
  addEnquiry({ name, email, phone, message });
  redirect("/enquire?sent=1");
}

export default async function EnquirePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; closed?: string }>;
}) {
  const params = await searchParams;
  const accepting = isAcceptingEnquiries();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Enquire</h1>
      {!accepting || params.closed === "1" ? (
        <p className="mt-6 rounded-md border border-line bg-paper px-4 py-4 text-lg text-muted">
          Every lock-up is let at the moment, so we are not taking new
          enquiries. Please try again later.
        </p>
      ) : params.sent === "1" ? (
        <p className="mt-6 rounded-md border border-line bg-paper px-4 py-4 text-lg">
          Thank you. Your message has been received. We will reply using the
          contact details you left.
        </p>
      ) : (
        <>
          <p className="mt-4 text-lg text-muted">
            If you would like to rent a lock-up on Swan Street, send a short
            message. There is no public phone number or email address on this
            site; this form is the way to reach us.
          </p>
          {params.error ? (
            <p className="mt-4 rounded-md bg-brick/10 px-4 py-3 text-sm text-brick-dark" role="alert">
              {params.error === "contact"
                ? "Please leave an email address or a phone number so we can reply."
                : params.error === "email"
                  ? "That email address does not look quite right."
                  : "Please include your name and a message."}
            </p>
          ) : null}
          <form action={submitEnquiry} className="mt-8 space-y-5 rounded-lg border border-line bg-paper p-6">
            <label className="block">
              <span className="text-sm font-semibold">Name</span>
              <input
                name="name"
                required
                autoComplete="name"
                className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Phone (optional)</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Message</span>
              <textarea
                name="message"
                required
                rows={6}
                className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-door px-5 py-3 font-semibold text-white hover:bg-door-dark"
            >
              Send enquiry
            </button>
          </form>
        </>
      )}
    </div>
  );
}
