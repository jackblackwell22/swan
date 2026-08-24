import { requireOwner } from "@/lib/auth";
import { isSmtpConfigured } from "@/lib/email";
import { monthLabel } from "@/lib/london";
import { formatGBP } from "@/lib/money";
import { listInvoices } from "@/lib/queries";
import { resendInvoiceAction } from "../../actions";

export const metadata = { title: "Invoices" };

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ resent?: string }>;
}) {
  await requireOwner();
  const params = await searchParams;
  const invoices = listInvoices();
  const smtp = isSmtpConfigured();

  return (
    <div>
      <h1 className="font-display text-4xl">Invoices</h1>
      <p className="mt-2 max-w-2xl text-muted">
        One PDF per tenant per landlord per month. Download any time. You can
        email or resend a PDF if the tenant has an address.
        {smtp
          ? null
          : " SMTP is not set in the environment yet; the row will show why sending failed."}
      </p>
      {params.resent ? (
        <p className="mt-4 rounded-md border border-line bg-paper px-4 py-3 text-sm">
          Email was attempted for that invoice. If it failed, the reason is
          listed on the row.
        </p>
      ) : null}
      {invoices.length === 0 ? (
        <p className="mt-8 text-muted">No invoices yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-dark/60">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Landlord</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">PDF</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 font-mono text-xs">
                    {invoice.payment_reference}
                  </td>
                  <td className="px-4 py-3">
                    {monthLabel(invoice.year, invoice.month)}
                  </td>
                  <td className="px-4 py-3">{invoice.tenant_name}</td>
                  <td className="px-4 py-3">{invoice.landlord_name}</td>
                  <td className="px-4 py-3">{formatGBP(invoice.total_pence)}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/invoices/${invoice.id}/pdf`}
                      className="font-semibold text-door hover:underline"
                    >
                      Download
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <form action={resendInvoiceAction}>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        type="submit"
                        className="font-semibold text-door hover:underline"
                      >
                        {invoice.emailed_at ? "Resend" : "Email"}
                      </button>
                    </form>
                    {invoice.email_error ? (
                      <p className="mt-1 text-xs text-brick-dark">
                        {invoice.email_error}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
