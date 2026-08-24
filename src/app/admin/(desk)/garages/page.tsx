import { requireOwner } from "@/lib/auth";
import { GARAGE_UNITS } from "@/lib/constants";
import { listGarages, listLandlords } from "@/lib/queries";
import { isAcceptingEnquiries } from "@/lib/settings";
import { saveGaragesAction } from "../../actions";

export const metadata = { title: "Garages" };

export default async function AdminGaragesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireOwner();
  const params = await searchParams;
  const garages = listGarages();
  const landlords = listLandlords();
  const accepting = isAcceptingEnquiries();

  return (
    <div>
      <h1 className="font-display text-4xl">Garages</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Choose who owns each of units {GARAGE_UNITS.join(", ")}. Leave a unit as
        “Not set” until you know. Address, bank details and from-email belong to
        that landlord only — nothing is invented.
      </p>
      {params.saved === "1" ? (
        <p className="mt-4 rounded-md border border-line bg-paper px-4 py-3 text-sm">
          Saved.
        </p>
      ) : null}

      <form action={saveGaragesAction} className="mt-8 space-y-10">
        <section className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-dark/60">
              <tr>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Landlord</th>
                <th className="px-4 py-3">Let to</th>
              </tr>
            </thead>
            <tbody>
              {garages.map((garage) => (
                <tr key={garage.unit} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">{garage.unit}</td>
                  <td className="px-4 py-3">
                    <select
                      name={`landlord_${garage.unit}`}
                      defaultValue={garage.landlord_id ?? "unset"}
                      className="rounded-md border border-line bg-cream px-2 py-1"
                    >
                      <option value="unset">Not set</option>
                      <option value="jack">Jack Blackwell</option>
                      <option value="david">David Blackwell</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">{garage.tenant_name ?? "Vacant"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {landlords.map((landlord) => (
            <section
              key={landlord.id}
              className="space-y-3 rounded-lg border border-line bg-paper p-5"
            >
              <h2 className="font-display text-2xl">{landlord.name}</h2>
              <label className="block text-sm">
                <span className="font-semibold">Postal address</span>
                <textarea
                  name={`${landlord.id}_postal_address`}
                  rows={4}
                  defaultValue={landlord.postal_address}
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">BACS account name</span>
                <input
                  name={`${landlord.id}_bacs_account_name`}
                  defaultValue={landlord.bacs_account_name}
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Sort code</span>
                <input
                  name={`${landlord.id}_bacs_sort_code`}
                  defaultValue={landlord.bacs_sort_code}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Account number</span>
                <input
                  name={`${landlord.id}_bacs_account_number`}
                  defaultValue={landlord.bacs_account_number}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">From-email</span>
                <input
                  name={`${landlord.id}_from_email`}
                  type="email"
                  defaultValue={landlord.from_email}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2"
                />
                <span className="mt-1 block text-muted">
                  Used as the From address on this landlord’s invoices when SMTP
                  is set in the environment. Leave blank until you have one.
                </span>
              </label>
            </section>
          ))}
        </div>

        <section className="space-y-3 rounded-lg border border-line bg-paper p-5">
          <h2 className="font-display text-2xl">Sending invoices</h2>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              name="accepting"
              defaultChecked={accepting}
              className="size-4 accent-door"
            />
            Accepting enquiries
          </label>
        </section>

        <button
          type="submit"
          className="rounded-md bg-door px-5 py-3 font-semibold text-white hover:bg-door-dark"
        >
          Save garage settings
        </button>
      </form>
    </div>
  );
}
