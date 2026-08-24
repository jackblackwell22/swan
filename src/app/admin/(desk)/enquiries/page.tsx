import { requireOwner } from "@/lib/auth";
import { listEnquiries } from "@/lib/queries";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage() {
  await requireOwner();
  const enquiries = listEnquiries();
  return (
    <div>
      <h1 className="font-display text-4xl">Enquiries</h1>
      <p className="mt-2 text-muted">
        Messages from the public form, newest first.
      </p>
      {enquiries.length === 0 ? (
        <p className="mt-8 text-muted">None yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {enquiries.map((enquiry) => (
            <li
              key={enquiry.id}
              className="rounded-lg border border-line bg-paper p-5"
            >
              <p className="font-semibold">{enquiry.name}</p>
              <p className="text-sm text-muted">
                {new Date(enquiry.created_at).toLocaleString("en-GB", {
                  timeZone: "Europe/London",
                })}
              </p>
              {enquiry.email ? (
                <p className="mt-1 text-sm">
                  <a className="text-door hover:underline" href={`mailto:${enquiry.email}`}>
                    {enquiry.email}
                  </a>
                </p>
              ) : null}
              {enquiry.phone ? (
                <p className="mt-1 text-sm">{enquiry.phone}</p>
              ) : null}
              <p className="mt-3 whitespace-pre-wrap text-ink">{enquiry.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
