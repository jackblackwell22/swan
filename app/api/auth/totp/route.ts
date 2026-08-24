import { NextRequest, NextResponse } from "next/server";
import {
  getPendingAuth,
  lookupAdmin,
  noteLogin,
  setSession,
  verifyTotp,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const pending = await getPendingAuth();
  if (!pending || pending.purpose !== "totp") {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const code = typeof body?.totp === "string" ? body.totp : "";
  const admin = lookupAdmin(pending.email);
  if (!admin || !verifyTotp(admin, code)) {
    noteLogin(ip, pending.email, false);
    return NextResponse.json({ error: "That authenticator code was not right." }, { status: 401 });
  }
  noteLogin(ip, pending.email, true);
  await setSession({ adminId: admin.id, email: admin.email });
  return NextResponse.json({ ok: true });
}
