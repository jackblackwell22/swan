import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isRateLimited,
  lookupAdmin,
  noteLogin,
  setPending,
  setSession,
  verifyPassword,
  verifyTotp,
} from "@/lib/auth";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .refine((value) => value.includes("@") && !value.includes(" ")),
  password: z.string().min(1),
  totp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  if (isRateLimited(ip, email)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 15 minutes." },
      { status: 429 },
    );
  }

  const admin = lookupAdmin(email);
  if (!admin || !(await verifyPassword(admin, parsed.data.password))) {
    noteLogin(ip, email, false);
    return NextResponse.json({ error: "Those details were not recognised." }, { status: 401 });
  }

  if (admin.totp_enabled && admin.totp_secret) {
    if (!parsed.data.totp) {
      await setPending({
        adminId: admin.id,
        email: admin.email,
        purpose: "totp",
      });
      return NextResponse.json({ ok: true, next: "totp" });
    }
    if (!verifyTotp(admin, parsed.data.totp)) {
      noteLogin(ip, email, false);
      return NextResponse.json({ error: "That authenticator code was not right." }, { status: 401 });
    }
    noteLogin(ip, email, true);
    await setSession({ adminId: admin.id, email: admin.email });
    return NextResponse.json({ ok: true, next: "app" });
  }

  noteLogin(ip, email, true);
  await setPending({
    adminId: admin.id,
    email: admin.email,
    purpose: "setup",
  });
  return NextResponse.json({ ok: true, next: "setup" });
}
