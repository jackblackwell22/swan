import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { EncryptJWT, jwtDecrypt } from "jose";
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import { getBusinessConfig, isProduction } from "@/lib/config";
import {
  getAdminByEmail,
  getAdminById,
  recentFailedLogins,
  recordLoginAttempt,
  type Admin,
} from "@/lib/db";

const SESSION_COOKIE = "swan_session";
const PENDING_COOKIE = "swan_pending";

export type Session = {
  adminId: number;
  email: string;
};

export type PendingAuth = Session & {
  purpose: "totp" | "setup";
};

function sessionKey() {
  const secret =
    process.env.SESSION_SECRET ||
    (isProduction() ? "" : "dev-session-secret-swan-street-lock-ups-32");
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

function cookieSettings(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
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

export async function getPendingAuth(): Promise<PendingAuth | null> {
  const jar = await cookies();
  const token = jar.get(PENDING_COOKIE)?.value;
  const payload = await decrypt<PendingAuth>(token);
  if (!payload?.adminId) return null;
  return payload;
}

export async function setSession(session: Session) {
  const jar = await cookies();
  jar.set(
    SESSION_COOKIE,
    await encrypt({ adminId: session.adminId, email: session.email }, 12 * 60),
    cookieSettings(12 * 60 * 60),
  );
  jar.delete(PENDING_COOKIE);
}

export async function setPending(pending: PendingAuth) {
  const jar = await cookies();
  jar.set(
    PENDING_COOKIE,
    await encrypt(pending, 10),
    cookieSettings(10 * 60),
  );
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(PENDING_COOKIE);
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function isRateLimited(ip: string, email: string): boolean {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const ipFails = recentFailedLogins(`ip:${ip}`, since);
  const emailFails = recentFailedLogins(`email:${email.toLowerCase()}`, since);
  return ipFails >= MAX_FAILURES || emailFails >= 8;
}

export function noteLogin(ip: string, email: string, ok: boolean) {
  recordLoginAttempt(`ip:${ip}`, ok);
  recordLoginAttempt(`email:${email.toLowerCase()}`, ok);
}

export async function verifyPassword(admin: Admin, password: string) {
  return bcrypt.compare(password, admin.password_hash);
}

export function totpFor(admin: Admin, secret = admin.totp_secret) {
  if (!secret) return null;
  const config = getBusinessConfig();
  return new TOTP({
    issuer: config.name,
    label: admin.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret.replace(/\s+/g, "")),
  });
}

export function verifyTotp(admin: Admin, code: string, secret = admin.totp_secret) {
  const totp = totpFor(admin, secret);
  if (!totp) return false;
  const delta = totp.validate({ token: code.replace(/\s+/g, ""), window: 1 });
  return delta !== null;
}

export function newTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export async function totpQrDataUrl(admin: Admin, secret: string) {
  const totp = totpFor(admin, secret);
  if (!totp) throw new Error("Could not build authenticator details.");
  return QRCode.toDataURL(totp.toString(), { margin: 1, width: 220 });
}

export function lookupAdmin(email: string): Admin | undefined {
  return getAdminByEmail(email);
}
