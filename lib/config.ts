import path from "node:path";
import dotenv from "dotenv";
import {
  LANDLORD_CODES,
  LANDLORD_IDS,
  LANDLORD_NAMES,
  type LandlordId,
} from "@/lib/landlords";

export {
  GARAGE_NUMBERS,
  LANDLORD_CODES,
  LANDLORD_IDS,
  LANDLORD_NAMES,
  isLandlordId,
  type GarageNumber,
  type LandlordId,
} from "@/lib/landlords";

dotenv.config({ path: ".env.local", quiet: true, override: true });
dotenv.config({ path: ".env", quiet: true });

function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

export type LandlordProfile = {
  id: LandlordId;
  name: string;
  code: "J" | "D";
  fromEmail: string;
  sortCode: string;
  accountNumber: string;
};

export function getLandlordConfig(id: LandlordId): LandlordProfile {
  const prefix = id === "jack" ? "JACK" : "DAVID";
  return {
    id,
    name: LANDLORD_NAMES[id],
    code: LANDLORD_CODES[id],
    fromEmail: trim(process.env[`${prefix}_FROM_EMAIL`]),
    sortCode: trim(
      process.env[`${prefix}_BANK_SORT_CODE`] || process.env[`${prefix}_SORT_CODE`],
    ),
    accountNumber: trim(
      process.env[`${prefix}_BANK_ACCOUNT_NUMBER`] ||
        process.env[`${prefix}_ACCOUNT_NUMBER`],
    ),
  };
}

export function getLandlords(): LandlordProfile[] {
  return LANDLORD_IDS.map(getLandlordConfig);
}

export type BusinessConfig = {
  name: string;
  address: string;
  email: string;
  phone: string;
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
    vatRegistered: vatFlag === "true" || vatFlag === "1" || vatFlag === "yes",
    vatNumber: trim(process.env.VAT_NUMBER),
    siteUrl: trim(process.env.SITE_URL) || "http://127.0.0.1:43141",
    invoiceDueDays: Number.isFinite(due) && due > 0 ? due : 14,
  };
}

export function isSmtpHostConfigured(): boolean {
  return Boolean(trim(process.env.SMTP_HOST));
}

export function isSmtpConfigured(): boolean {
  return isSmtpHostConfigured();
}

export function canEmailAsLandlord(id: LandlordId): boolean {
  return isSmtpHostConfigured() && Boolean(getLandlordConfig(id).fromEmail);
}

export function landlordHasBankDetails(id: LandlordId): boolean {
  const landlord = getLandlordConfig(id);
  return Boolean(landlord.sortCode && landlord.accountNumber);
}

export function landlordEnvPrefix(id: LandlordId): "JACK" | "DAVID" {
  return id === "jack" ? "JACK" : "DAVID";
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
  if (!isSmtpHostConfigured()) return null;
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
    const totpSecret = trim(process.env[`ADMIN${n}_TOTP_SECRET`]).replace(/\s+/g, "");
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
