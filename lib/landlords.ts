export const GARAGE_NUMBERS = [7, 8, 9, 10, 11, 12] as const;
export type GarageNumber = (typeof GARAGE_NUMBERS)[number];

export const LANDLORD_IDS = ["jack", "david"] as const;
export type LandlordId = (typeof LANDLORD_IDS)[number];

export const LANDLORD_NAMES: Record<LandlordId, string> = {
  jack: "Jack Blackwell",
  david: "David Blackwell",
};

export const LANDLORD_CODES: Record<LandlordId, "J" | "D"> = {
  jack: "J",
  david: "D",
};

export function isLandlordId(value: string | null | undefined): value is LandlordId {
  return value === "jack" || value === "david";
}

export function addressLines(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .replaceAll("\\n", "\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function bacsLines(landlord: {
  accountName?: string;
  sortCode?: string;
  accountNumber?: string;
}): string[] {
  const lines: string[] = [];
  if (landlord.accountName?.trim()) {
    lines.push(`Account name  ${landlord.accountName.trim()}`);
  }
  if (landlord.sortCode?.trim()) {
    lines.push(`Sort code  ${landlord.sortCode.trim()}`);
  }
  if (landlord.accountNumber?.trim()) {
    lines.push(`Account number  ${landlord.accountNumber.trim()}`);
  }
  return lines;
}
