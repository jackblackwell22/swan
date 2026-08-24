import { getDb } from "./db";

export function getSetting(key: string) {
  const row = getDb()
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return row?.value ?? "";
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function isAcceptingEnquiries() {
  const value = getSetting("accepting_enquiries");
  return value !== "0";
}

export function setAcceptingEnquiries(on: boolean) {
  setSetting("accepting_enquiries", on ? "1" : "0");
}

export function getFromEmail() {
  return getSetting("from_email").trim();
}

export function setFromEmail(email: string) {
  setSetting("from_email", email.trim());
}
