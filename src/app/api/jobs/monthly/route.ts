import { NextResponse } from "next/server";
import { runMonthlyInvoices } from "@/lib/invoices";
import { safeEqual } from "@/lib/safe-equal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  const x = request.headers.get("x-cron-secret")?.trim() ?? "";
  const url = new URL(request.url);
  const query = url.searchParams.get("secret")?.trim() ?? "";
  return (
    (bearer.length > 0 && safeEqual(bearer, secret)) ||
    (x.length > 0 && safeEqual(x, secret)) ||
    (query.length > 0 && safeEqual(query, secret))
  );
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") ?? "") || undefined;
  const month = Number(url.searchParams.get("month") ?? "") || undefined;
  const result = await runMonthlyInvoices({ year, month });
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
