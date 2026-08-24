export function formatGBP(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function penceFromPoundsInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/£/g, "").replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function poundsInputFromPence(pence: number) {
  return (pence / 100).toFixed(2);
}
