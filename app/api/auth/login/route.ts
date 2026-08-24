import { NextRequest, NextResponse } from "next/server";
import { lookupAdmin, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { EncryptJWT } from "jose";
import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";

function sessionKey() {
  const secret =
    process.env.SESSION_SECRET || "dev-session-secret-swan-street-lock-ups-32";
  return createHash("sha256").update(secret).digest();
}

export async function POST(request: NextRequest) {
  getDb();
  const contentType = request.headers.get("content-type") || "";
  let email = "";
  let password = "";
  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => null)) as {
      email?: string;
      password?: string;
    } | null;
    email = String(json?.email ?? "")
      .trim()
      .toLowerCase();
    password = String(json?.password ?? "");
  } else {
    const form = await request.formData().catch(() => null);
    email = String(form?.get("email") ?? "")
      .trim()
      .toLowerCase();
    password = String(form?.get("password") ?? "");
  }

  if (!email.includes("@") || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const admin = lookupAdmin(email);
  if (!admin || !(await verifyPassword(admin, password))) {
    return NextResponse.json(
      { error: "Those details were not recognised." },
      { status: 401 },
    );
  }
  const token = await new EncryptJWT({ adminId: admin.id, email: admin.email })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .encrypt(sessionKey());
  const options = await sessionCookieOptions();
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin" },
  });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    maxAge: options.maxAge,
  });
  return response;
}
