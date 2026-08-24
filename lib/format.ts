const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function londonDateISO(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseISODate(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = iso.split("-").map((part) => Number.parseInt(part, 10));
  return { year, month, day };
}

export function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function formatUKDate(iso: string): string {
  const { year, month, day } = parseISODate(iso);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function monthAbbrev(month: number): string {
  return MONTHS[month - 1] ?? "JAN";
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "January";
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDaysISO(iso: string, days: number): string {
  const { year, month, day } = parseISODate(iso);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function unitKey(unitLabel: string): string {
  return unitLabel.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function paymentReference(unitLabel: string, periodStartISO: string): string {
  const { year, month } = parseISODate(periodStartISO);
  const yy = String(year).slice(-2);
  return `SWAN-${unitKey(unitLabel)}-${monthAbbrev(month)}${yy}`;
}

export function periodLabel(periodStartISO: string): string {
  const { year, month } = parseISODate(periodStartISO);
  return `${monthName(month)} ${year}`;
}

export function compareISODate(a: string, b: string): number {
  return a.localeCompare(b);
}
