import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { GARAGE_UNITS, LANDLORDS } from "./constants";

type GlobalDb = typeof globalThis & { __swanDb?: Database.Database };

function dataDirectory() {
  if (process.env.DATABASE_PATH?.trim()) {
    return path.dirname(path.resolve(process.env.DATABASE_PATH.trim()));
  }
  return path.join(process.cwd(), "data");
}

export function getDataDir() {
  const dir = dataDirectory();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDatabasePath() {
  if (process.env.DATABASE_PATH?.trim()) {
    return path.resolve(process.env.DATABASE_PATH.trim());
  }
  return path.join(getDataDir(), "swan.sqlite");
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS landlords (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      postal_address TEXT NOT NULL DEFAULT '',
      bacs_account_name TEXT NOT NULL DEFAULT '',
      bacs_sort_code TEXT NOT NULL DEFAULT '',
      bacs_account_number TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS garages (
      unit INTEGER PRIMARY KEY,
      landlord_id TEXT REFERENCES landlords(id)
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      garage_unit INTEGER NOT NULL REFERENCES garages(unit),
      rent_pence INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS one_active_tenancy
      ON tenancies(garage_unit) WHERE ended_at IS NULL;

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      landlord_id TEXT NOT NULL REFERENCES landlords(id),
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      payment_reference TEXT NOT NULL UNIQUE,
      total_pence INTEGER NOT NULL,
      pdf_relpath TEXT NOT NULL,
      emailed_at TEXT,
      email_error TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(tenant_id, landlord_id, year, month)
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      garage_unit INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount_pence INTEGER NOT NULL
    );
  `);

  const insertLandlord = db.prepare(
    `INSERT OR IGNORE INTO landlords (id, name) VALUES (?, ?)`,
  );
  for (const landlord of LANDLORDS) {
    insertLandlord.run(landlord.id, landlord.name);
  }

  const insertGarage = db.prepare(
    `INSERT OR IGNORE INTO garages (unit, landlord_id) VALUES (?, NULL)`,
  );
  for (const unit of GARAGE_UNITS) {
    insertGarage.run(unit);
  }

  db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('accepting_enquiries', '1')`,
  ).run();
  db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('from_email', '')`,
  ).run();
}

export function getDb() {
  const globalDb = globalThis as GlobalDb;
  if (globalDb.__swanDb) return globalDb.__swanDb;

  const file = getDatabasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  globalDb.__swanDb = db;
  return db;
}

export type LandlordRow = {
  id: string;
  name: string;
  postal_address: string;
  bacs_account_name: string;
  bacs_sort_code: string;
  bacs_account_number: string;
};

export type GarageRow = {
  unit: number;
  landlord_id: string | null;
};

export type TenantRow = {
  id: number;
  name: string;
  email: string;
  notes: string;
  created_at: string;
};

export type TenancyRow = {
  id: number;
  tenant_id: number;
  garage_unit: number;
  rent_pence: number;
  started_at: string;
  ended_at: string | null;
};

export type EnquiryRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
};

export type InvoiceRow = {
  id: number;
  tenant_id: number;
  landlord_id: string;
  year: number;
  month: number;
  payment_reference: string;
  total_pence: number;
  pdf_relpath: string;
  emailed_at: string | null;
  email_error: string | null;
  created_at: string;
};
