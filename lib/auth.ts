import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { EncryptJWT, jwtDecrypt } from "jose";
import {
  getAdminByEmail,
  getAdminById,
  type Admin,
} from "@/lib/db";

export const SESSION_COOKIE = "swan_session";

export type Session = {
  adminId: number;
  email: string;
};

function sessionKey() {
  const secret =
    process.env.SESSION_SECRET || "dev-session-secret-swan-street-lock-ups-32";
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to a long random string.");
  }
  return createHash("sha256").update(secret).digest();
}

async function encrypt(payload: Record<string, unknown>, minutes: number) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${minutes}m`)
    .encrypt(sessionKey());
}

async function decrypt<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, sessionKey());
    return payload as T;
  } catch {
    return null;
  }
}

async function requestIsHttps(): Promise<boolean> {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim().toLowerCase();
  if (proto === "https") return true;
  if ((h.get("x-forwarded-ssl") || "").toLowerCase() === "on") return true;
  const origin = h.get("origin") || h.get("referer") || "";
  if (origin.startsWith("https:")) return true;
  return false;
}

function hostIsLocal(host: string): boolean {
  const value = host.toLowerCase();
  return value.includes("127.0.0.1") || value.includes("localhost");
}

export async function sessionCookieOptions() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const local = hostIsLocal(host);
  const https = !local && (await requestIsHttps());
  return {
    httpOnly: true as const,
    secure: https,
    sameSite: (https ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  };
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const payload = await decrypt<{ adminId: number; email: string }>(token);
  if (!payload?.adminId || !payload.email) return null;
  const admin = getAdminById(payload.adminId);
  if (!admin) return null;
  return { adminId: admin.id, email: admin.email };
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function setSession(session: Session) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await encrypt({ adminId: session.adminId, email: session.email }, 12 * 60), {
    ...(await sessionCookieOptions()),
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function verifyPassword(admin: Admin, password: string) {
  return bcrypt.compare(password, admin.password_hash);
}

export function lookupAdmin(email: string): Admin | undefined {
  return getAdminByEmail(email);
}
