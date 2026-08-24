import { listEnquiries } from "@/lib/db";
import { formatUKDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = {
  business: "Business",
  private: "Private",
  vehicle: "Vehicle",
  storage: "Storage",
  other: "Other",
};

export default function EnquiriesPage() {
  const enquiries = listEnquiries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-ink">Enquiries</h1>
        <p className="text-sm text-muted-foreground">
          Messages from the public form. If email is set up, a copy also goes to the business address.
        </p>
      </div>
      {enquiries.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-muted-foreground ring-1 ring-border">
          No enquiries yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id} className="rounded-xl bg-white p-5 ring-1 ring-border">
              <p className="font-medium text-ink">{enquiry.name}</p>
              <p className="text-sm text-muted-foreground">
                {enquiry.email}
                {enquiry.phone ? ` · ${enquiry.phone}` : ""} ·{" "}
                {kindLabel[enquiry.tenant_kind] ?? enquiry.tenant_kind} ·{" "}
                {kindLabel[enquiry.use_type] ?? enquiry.use_type}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink/80">{enquiry.message}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatUKDate(enquiry.created_at.slice(0, 10))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
