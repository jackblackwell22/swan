import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true, override: true });
dotenv.config({ path: ".env", quiet: true });

function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

export type BusinessConfig = {
  name: string;
  address: string;
  email: string;
  phone: string;
  sortCode: string;
  accountNumber: string;
  vatRegistered: boolean;
  vatNumber: string;
  siteUrl: string;
  invoiceDueDays: number;
};

export function getBusinessConfig(): BusinessConfig {
  const vatFlag = trim(process.env.VAT_REGISTERED).toLowerCase();
  const due = Number.parseInt(trim(process.env.INVOICE_DUE_DAYS) || "14", 10);

  return {
    name: trim(process.env.BUSINESS_NAME) || "Swan Street Lock-Ups",
    address: trim(process.env.BUSINESS_ADDRESS),
    email: trim(process.env.BUSINESS_EMAIL),
    phone: trim(process.env.BUSINESS_PHONE),
    sortCode: trim(process.env.BANK_SORT_CODE),
    accountNumber: trim(process.env.BANK_ACCOUNT_NUMBER),
    vatRegistered: vatFlag === "true" || vatFlag === "1" || vatFlag === "yes",
    vatNumber: trim(process.env.VAT_NUMBER),
    siteUrl: trim(process.env.SITE_URL) || "http://127.0.0.1:43141",
    invoiceDueDays: Number.isFinite(due) && due > 0 ? due : 14,
  };
}

export function hasBankDetails(config = getBusinessConfig()): boolean {
  return Boolean(config.sortCode && config.accountNumber);
}

export function isSmtpConfigured(): boolean {
  return Boolean(trim(process.env.SMTP_HOST) && trim(process.env.FROM_EMAIL));
}

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
};

export function getSmtpConfig(): SmtpConfig | null {
  if (!isSmtpConfigured()) return null;
  const port = Number.parseInt(trim(process.env.SMTP_PORT) || "587", 10);
  const secureFlag = trim(process.env.SMTP_SECURE).toLowerCase();
  return {
    host: trim(process.env.SMTP_HOST),
    port: Number.isFinite(port) ? port : 587,
    user: trim(process.env.SMTP_USER),
    pass: trim(process.env.SMTP_PASS),
    from: trim(process.env.FROM_EMAIL),
    secure: secureFlag === "true" || secureFlag === "1" || port === 465,
  };
}

export type AdminSeed = {
  email: string;
  password: string;
  totpSecret: string;
};

export function getAdminSeeds(): AdminSeed[] {
  const seeds: AdminSeed[] = [];
  for (const n of [1, 2] as const) {
    const email = trim(process.env[`ADMIN${n}_EMAIL`]);
    const password = trim(process.env[`ADMIN${n}_PASSWORD`]);
    const totpSecret = trim(process.env[`ADMIN${n}_TOTP_SECRET`]).replace(
      /\s+/g,
      "",
    );
    if (email && password) {
      seeds.push({ email, password, totpSecret });
    }
  }
  return seeds;
}

export function getDatabasePath(): string {
  const configured = trim(process.env.DATABASE_PATH);
  if (configured && path.isAbsolute(configured)) return configured;
  const name = path.basename(configured || "swan-street.db") || "swan-street.db";
  return path.join(process.cwd(), "data", name);
}

export function getCronSecret(): string {
  return trim(process.env.CRON_SECRET);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}
