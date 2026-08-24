import { LANDLORDS, MONTH_CODES, type LandlordId } from "./constants";

export function landlordCode(id: string): string {
  return LANDLORDS.find((landlord) => landlord.id === id)?.code ?? id.slice(0, 1).toUpperCase();
}

export function monthCode(year: number, month: number) {
  const code = MONTH_CODES[month - 1] ?? String(month).padStart(2, "0");
  return `${code}${String(year).slice(-2)}`;
}

/** e.g. SWAN-J-7-8-SEP26 */
export function paymentReference(
  landlordId: LandlordId | string,
  units: number[],
  year: number,
  month: number,
) {
  const sorted = [...units].sort((a, b) => a - b);
  return `SWAN-${landlordCode(landlordId)}-${sorted.join("-")}-${monthCode(year, month)}`;
}

export function isLandlordId(value: string): value is LandlordId {
  return value === "jack" || value === "david";
}
