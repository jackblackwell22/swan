import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { isSmtpConfigured } from "@/lib/email";
import { londonParts, monthLabel } from "@/lib/london";
import { formatGBP } from "@/lib/money";
import { listGarages, listInvoices } from "@/lib/queries";
import { isAcceptingEnquiries } from "@/lib/settings";
import { generateThisMonthAction, saveAcceptingAction } from "../actions";

export const metadata = { title: "This month" };

export default async function ThisMonthPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string }>;
}) {
  await requireOwner();
  const params = await searchParams;
  const now = londonParts();
  const accepting = isAcceptingEnquiries();
  const smtp = isSmtpConfigured();
  const garages = listGarages();
  const invoices = listInvoices(now.year, now.month);

  return (
    <div>
      <h1 className="font-display text-4xl">{monthLabel(now.year, now.month)}</h1>
      <p className="mt-2 text-muted">
        Occupancy and invoices for this calendar month in the UK. This page does
        not track paid or unpaid rent.
      </p>

      {params.generated === "1" ? (
        <p className="mt-4 rounded-md border border-line bg-paper px-4 py-3 text-sm">
          This month’s invoices have been prepared. Existing ones were left as
          they were.
        </p>
      ) : null}

      <form
        action={saveAcceptingAction}
        className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-paper p-5"
      >
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name="accepting"
            defaultChecked={accepting}
            className="size-4 accent-door"
          />
          Accepting enquiries
        </label>
        <button
          type="submit"
          className="rounded-md bg-door px-4 py-2 text-sm font-semibold text-white hover:bg-door-dark"
        >
          Save
        </button>
        <p className="w-full text-sm text-muted">
          {accepting
            ? "The public enquiry form is on, and Enquire links are shown."
            : "The public form is hidden, Enquire links are gone, and new messages are refused. The public site says every lock-up is let."}
        </p>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Lock-ups 7–12</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-dark/60">
              <tr>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Landlord</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Rent</th>
              </tr>
            </thead>
            <tbody>
              {garages.map((garage) => (
                <tr key={garage.unit} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">{garage.unit}</td>
                  <td className="px-4 py-3">
                    {garage.landlord_id === "jack"
                      ? "Jack Blackwell"
                      : garage.landlord_id === "david"
                        ? "David Blackwell"
                        : "Not set"}
                  </td>
                  <td className="px-4 py-3">{garage.tenant_name ?? "Vacant"}</td>
                  <td className="px-4 py-3">
                    {garage.rent_pence != null ? formatGBP(garage.rent_pence) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Invoices this month</h2>
            <p className="mt-1 text-sm text-muted">
              {smtp
                ? "Outgoing email is configured. New invoices are emailed when a tenant has an address."
                : "Email is not configured. PDFs are still generated; set SMTP in the environment when you want sending."}
            </p>
          </div>
          <form action={generateThisMonthAction}>
            <button
              type="submit"
              className="rounded-md bg-door px-4 py-2 text-sm font-semibold text-white hover:bg-door-dark"
            >
              Create this month’s invoices
            </button>
          </form>
        </div>
        {invoices.length === 0 ? (
          <p className="mt-4 text-sm text-muted">None yet for this month.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-paper">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold">{invoice.payment_reference}</p>
                  <p className="text-sm text-muted">
                    {invoice.tenant_name} · {invoice.landlord_name} ·{" "}
                    {formatGBP(invoice.total_pence)}
                  </p>
                </div>
                <a
                  href={`/admin/invoices/${invoice.id}/pdf`}
                  className="text-sm font-semibold text-door hover:underline"
                >
                  Download PDF
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm">
          <Link href="/admin/invoices" className="font-semibold text-door hover:underline">
            All invoices
          </Link>
        </p>
      </section>
    </div>
  );
}
