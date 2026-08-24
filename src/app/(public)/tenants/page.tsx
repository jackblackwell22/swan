import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For tenants",
};

export default function TenantsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">For tenants</h1>
      <p className="mt-4 text-lg text-muted">
        If you already rent a lock-up on Swan Street, this is how rent invoices
        work.
      </p>
      <ol className="mt-8 space-y-6">
        <li className="rounded-lg border border-line bg-paper p-6">
          <h2 className="font-display text-2xl">1. An invoice on the first of the month</h2>
          <p className="mt-2 text-muted">
            Invoices are prepared on the 1st of each month (at 8:05am UK time,
            when the website’s computer is running). You get one invoice per
            landlord. If you rent two lock-ups from the same landlord, that is
            one invoice with two lines. If you rent from both landlords, you get
            two invoices.
          </p>
        </li>
        <li className="rounded-lg border border-line bg-paper p-6">
          <h2 className="font-display text-2xl">2. Pay by bank transfer</h2>
          <p className="mt-2 text-muted">
            Pay the amount on the invoice by BACS, using the bank details printed
            on that invoice. Please use the payment reference exactly as shown
            (for example <span className="font-mono text-ink">SWAN-J-7-8-SEP26</span>)
            so the payment can be matched.
          </p>
        </li>
        <li className="rounded-lg border border-line bg-paper p-6">
          <h2 className="font-display text-2xl">3. PDF by email, when email is set up</h2>
          <p className="mt-2 text-muted">
            If outgoing email is configured, the PDF is sent to the address on
            file for you. If email is not configured, the PDF is still generated
            and can be passed to you.
          </p>
        </li>
      </ol>
    </div>
  );
}
