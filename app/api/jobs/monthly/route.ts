import { NextRequest, NextResponse } from "next/server";
import { getCronSecret } from "@/lib/config";
import { runMonthlyInvoiceJob } from "@/lib/jobs";

function authorised(request: NextRequest) {
  const secret = getCronSecret();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = request.nextUrl.searchParams.get("secret") || "";
  return token === secret || query === secret;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const result = await runMonthlyInvoiceJob();
  return NextResponse.json(result);
}

export const POST = GET;
