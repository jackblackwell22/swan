import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_NAME,
  LANDLORDS,
  SESSION_MAX_AGE_SECONDS,
  type LandlordId,
} from "./constants";
import { safeEqual } from "./safe-equal";

type OwnerAccount = {
  id: LandlordId;
  name: string;
  username: string;
  password: string;
};

type SessionPayload = {
  owner: LandlordId;
  exp: number;
};

function sessionSecret() {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  const g = globalThis as typeof globalThis & { __swanSessionSecret?: string };
  if (!g.__swanSessionSecret) {
    g.__swanSessionSecret = randomBytes(32).toString("hex");
  }
  return g.__swanSessionSecret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function getOwnerAccounts(): OwnerAccount[] {
  const accounts: OwnerAccount[] = [];
  const jackUser = process.env.JACK_USERNAME?.trim() ?? "";
  const jackPass = process.env.JACK_PASSWORD ?? "";
  if (jackUser && jackPass) {
    accounts.push({
      id: "jack",
      name: "Jack Blackwell",
      username: jackUser,
      password: jackPass,
    });
  }
  const davidUser = process.env.DAVID_USERNAME?.trim() ?? "";
  const davidPass = process.env.DAVID_PASSWORD ?? "";
  if (davidUser && davidPass) {
    accounts.push({
      id: "david",
      name: "David Blackwell",
      username: davidUser,
      password: davidPass,
    });
  }
  return accounts;
}

export function ownersConfigured() {
  return getOwnerAccounts().length > 0;
}

export function canOpenDevDesk() {
  return process.env.NODE_ENV !== "production" && ownersConfigured();
}

export function verifyOwnerLogin(username: string, password: string): LandlordId | null {
  const user = username.trim();
  if (!user || !password) return null;
  for (const account of getOwnerAccounts()) {
    if (safeEqual(account.username, user) && safeEqual(account.password, password)) {
      return account.id;
    }
  }
  return null;
}

function encodeSession(owner: LandlordId) {
  const payload: SessionPayload = {
    owner,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function decodeSession(token: string | undefined): LandlordId | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    if (payload.owner !== "jack" && payload.owner !== "david") return null;
    return payload.owner;
  } catch {
    return null;
  }
}

export async function setOwnerSession(owner: LandlordId) {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(owner), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearOwnerSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionOwner(): Promise<LandlordId | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function requireOwner(): Promise<LandlordId> {
  const owner = await getSessionOwner();
  if (!owner) redirect("/admin/login");
  return owner;
}

export function ownerDisplayName(id: LandlordId) {
  return LANDLORDS.find((landlord) => landlord.id === id)?.name ?? id;
}
