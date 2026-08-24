import { GarageLandlordForm } from "@/components/admin/garage-landlord-form";
import { LandlordAddressForm } from "@/components/admin/landlord-address-form";
import { AcceptingEnquiriesToggle } from "@/components/admin/accepting-enquiries-toggle";
import { getResolvedLandlord, isAcceptingEnquiries, listGarages } from "@/lib/db";
import { LANDLORD_IDS } from "@/lib/landlords";

export const dynamic = "force-dynamic";

export default function GaragesAdminPage() {
  const garages = listGarages();
  const landlords = LANDLORD_IDS.map(getResolvedLandlord);
  const acceptingEnquiries = isAcceptingEnquiries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-ink">Garages</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The lock-ups are numbered 7, 8, 9, 10, 11 and 12. Each belongs to either
          Jack Blackwell or David Blackwell. Leave a garage unset until you know
          whose it is — the desk will not guess.
        </p>
      </div>
      <AcceptingEnquiriesToggle accepting={acceptingEnquiries} />
      <GarageLandlordForm garages={garages} />
      <LandlordAddressForm landlords={landlords} />
      <section className="max-w-2xl space-y-2 rounded-xl bg-white p-5 text-sm ring-1 ring-border">
        <h2 className="text-lg text-ink">Payment references</h2>
        <p className="text-muted-foreground">
          Each invoice has a unique payment reference so the tenant can put it on
          the bank transfer:
        </p>
        <p className="font-mono text-sm">SWAN-{"{J|D}"}-{"{garages}"}-{"{MON}"}{"{YY}"}</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <span className="font-mono text-ink">J</span> is Jack Blackwell,{" "}
            <span className="font-mono text-ink">D</span> is David Blackwell.
          </li>
          <li>
            Garage numbers on that invoice are listed in order, hyphen-separated.
          </li>
          <li>
            Two of Jack’s units for one tenant in September 2026:{" "}
            <span className="font-mono text-ink">SWAN-J-7-8-SEP26</span>.
          </li>
          <li>
            One of David’s units that month:{" "}
            <span className="font-mono text-ink">SWAN-D-10-SEP26</span>.
          </li>
        </ul>
        <p className="text-muted-foreground">
          If a tenant rents from both of you, that month produces two invoices and
          two emails, each from the landlord of those garages. The tenant pays
          that landlord’s BACS account, printed on the PDF when you have filled
          it in.
        </p>
      </section>
    </div>
  );
}
