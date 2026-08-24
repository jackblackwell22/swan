import { NextResponse } from "next/server";
import { getAdminById } from "@/lib/db";
import {
  getPendingAuth,
  newTotpSecret,
  setSession,
  totpQrDataUrl,
  verifyTotp,
} from "@/lib/auth";
import { enableTotp } from "@/lib/db";

export async function GET() {
  const pending = await getPendingAuth();
  if (!pending || pending.purpose !== "setup") {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }
  const admin = getAdminById(pending.adminId);
  if (!admin) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }
  const secret = newTotpSecret();
  const qr = await totpQrDataUrl(admin, secret);
  return NextResponse.json({ qr, secret });
}

export async function POST(request: Request) {
  const pending = await getPendingAuth();
  if (!pending || pending.purpose !== "setup") {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const code = typeof body?.totp === "string" ? body.totp : "";
  const secret = typeof body?.secret === "string" ? body.secret : "";
  const admin = getAdminById(pending.adminId);
  if (!admin || !secret || !verifyTotp(admin, code, secret)) {
    return NextResponse.json(
      { error: "That authenticator code was not right." },
      { status: 401 },
    );
  }
  enableTotp(admin.id, secret);
  await setSession({ adminId: admin.id, email: admin.email });
  return NextResponse.json({ ok: true });
}
