import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { getAdminSeeds, getDatabasePath, isDevelopment } from "@/lib/config";

const globalForDb = globalThis as unknown as {
  swanDb?: Database.Database;
};

export type TenantType = "business" | "private";
export type TenantStatus = "active" | "ended";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type MatchKind = "reference" | "suggested" | "ambiguous" | "none" | "confirmed";

export type Admin = {
  id: number;
  email: string;
  password_hash: string;
  totp_secret: string | null;
  totp_enabled: number;
  created_at: string;
};

export type Tenant = {
  id: number;
  name: string;
  email: string;
  unit_label: string;
  monthly_rent_pence: number;
  tenant_type: TenantType;
  status: TenantStatus;
  is_sample: number;
  created_at: string;
};

export type Invoice = {
  id: number;
  tenant_id: number;
  invoice_number: string;
  period_start: string;
  period_end: string;
  issue_date: string;
  due_date: string;
  amount_pence: number;
  status: InvoiceStatus;
  payment_reference: string;
  sent_at: string | null;
  paid_at: string | null;
  reminder_7_sent_at: string | null;
  reminder_14_sent_at: string | null;
  pdf_path: string | null;
  created_at: string;
};

export type InvoiceWithTenant = Invoice & {
  tenant_name: string;
  tenant_email: string;
  unit_label: string;
  is_sample: number;
};

export type Payment = {
  id: number;
  invoice_id: number;
  amount_pence: number;
  paid_at: string;
  method: string;
  notes: string | null;
  created_at: string;
};

export type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  tenant_kind: string;
  use_type: string;
  message: string;
  created_at: string;
};

export type StatementRow = {
  id: number;
  batch_id: string;
  row_date: string;
  description: string;
  amount_pence: number;
  matched_invoice_id: number | null;
  match_kind: MatchKind | null;
  created_at: string;
};

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      totp_secret TEXT,
      totp_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      unit_label TEXT NOT NULL,
      monthly_rent_pence INTEGER NOT NULL,
      tenant_type TEXT NOT NULL CHECK (tenant_type IN ('business', 'private')),
      status TEXT NOT NULL CHECK (status IN ('active', 'ended')),
      is_sample INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      invoice_number TEXT NOT NULL UNIQUE,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      amount_pence INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
      payment_reference TEXT NOT NULL UNIQUE,
      sent_at TEXT,
      paid_at TEXT,
      reminder_7_sent_at TEXT,
      reminder_14_sent_at TEXT,
      pdf_path TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      amount_pence INTEGER NOT NULL,
      paid_at TEXT NOT NULL,
      method TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      tenant_kind TEXT NOT NULL,
      use_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS statement_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      row_date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount_pence INTEGER NOT NULL,
      matched_invoice_id INTEGER REFERENCES invoices(id),
      match_kind TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      ok INTEGER NOT NULL,
      attempted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name TEXT NOT NULL,
      run_for TEXT NOT NULL,
      status TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(period_start);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_key ON login_attempts(key, attempted_at);
  `);
}

function syncAdmins(db: Database.Database) {
  const seeds = getAdminSeeds();
  const now = new Date().toISOString();
  for (const seed of seeds) {
    const hash = bcrypt.hashSync(seed.password, 12);
    const existing = db
      .prepare("SELECT * FROM admins WHERE email = ?")
      .get(seed.email) as Admin | undefined;
    if (!existing) {
      db.prepare(
        `INSERT INTO admins (email, password_hash, totp_secret, totp_enabled, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(
        seed.email,
        hash,
        seed.totpSecret || null,
        seed.totpSecret ? 1 : 0,
        now,
      );
      continue;
    }
    const totpSecret = seed.totpSecret || existing.totp_secret;
    const totpEnabled = seed.totpSecret
      ? 1
      : existing.totp_enabled;
    db.prepare(
      `UPDATE admins SET password_hash = ?, totp_secret = ?, totp_enabled = ? WHERE id = ?`,
    ).run(hash, totpSecret, totpEnabled, existing.id);
  }
}

function seedSampleTenants(db: Database.Database) {
  if (!isDevelopment()) return;
  const count = db.prepare("SELECT COUNT(*) AS n FROM tenants").get() as { n: number };
  if (count.n > 0) return;
  const now = new Date().toISOString();
  const samples: Array<Omit<Tenant, "id" | "created_at">> = [
    {
      name: "EXAMPLE — Riverside Cycles Ltd (sample data)",
      email: "example-riverside@invalid.test",
      unit_label: "Ex1",
      monthly_rent_pence: 17500,
      tenant_type: "business",
      status: "active",
      is_sample: 1,
    },
    {
      name: "EXAMPLE — A. Patel (sample data)",
      email: "example-patel@invalid.test",
      unit_label: "Ex2",
      monthly_rent_pence: 12000,
      tenant_type: "private",
      status: "active",
      is_sample: 1,
    },
    {
      name: "EXAMPLE — J. Hughes (sample data)",
      email: "example-hughes@invalid.test",
      unit_label: "Ex3",
      monthly_rent_pence: 12000,
      tenant_type: "private",
      status: "active",
      is_sample: 1,
    },
  ];
  const insert = db.prepare(
    `INSERT INTO tenants (name, email, unit_label, monthly_rent_pence, tenant_type, status, is_sample, created_at)
     VALUES (@name, @email, @unit_label, @monthly_rent_pence, @tenant_type, @status, @is_sample, @created_at)`,
  );
  for (const sample of samples) {
    insert.run({ ...sample, created_at: now });
  }
}

export function getDb(): Database.Database {
  if (globalForDb.swanDb) return globalForDb.swanDb;
  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), "data", "invoices"), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  syncAdmins(db);
  seedSampleTenants(db);
  globalForDb.swanDb = db;
  return db;
}

export function getAdminByEmail(email: string): Admin | undefined {
  return getDb()
    .prepare("SELECT * FROM admins WHERE email = ?")
    .get(email.trim()) as Admin | undefined;
}

export function getAdminById(id: number): Admin | undefined {
  return getDb().prepare("SELECT * FROM admins WHERE id = ?").get(id) as
    | Admin
    | undefined;
}

export function enableTotp(adminId: number, secret: string) {
  getDb()
    .prepare("UPDATE admins SET totp_secret = ?, totp_enabled = 1 WHERE id = ?")
    .run(secret, adminId);
}

export function recordLoginAttempt(key: string, ok: boolean) {
  getDb()
    .prepare(
      "INSERT INTO login_attempts (key, ok, attempted_at) VALUES (?, ?, ?)",
    )
    .run(key, ok ? 1 : 0, new Date().toISOString());
}

export function recentFailedLogins(key: string, sinceIso: string): number {
  const row = getDb()
    .prepare(
      "SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND ok = 0 AND attempted_at >= ?",
    )
    .get(key, sinceIso) as { n: number };
  return row.n;
}

export function listTenants(): Tenant[] {
  return getDb()
    .prepare("SELECT * FROM tenants ORDER BY status ASC, unit_label COLLATE NOCASE ASC")
    .all() as Tenant[];
}

export function listActiveTenants(): Tenant[] {
  return getDb()
    .prepare("SELECT * FROM tenants WHERE status = 'active' ORDER BY unit_label COLLATE NOCASE")
    .all() as Tenant[];
}

export function getTenant(id: number): Tenant | undefined {
  return getDb().prepare("SELECT * FROM tenants WHERE id = ?").get(id) as
    | Tenant
    | undefined;
}

export function createTenant(input: {
  name: string;
  email: string;
  unit_label: string;
  monthly_rent_pence: number;
  tenant_type: TenantType;
  status: TenantStatus;
}): Tenant {
  const result = getDb()
    .prepare(
      `INSERT INTO tenants (name, email, unit_label, monthly_rent_pence, tenant_type, status, is_sample, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    )
    .run(
      input.name,
      input.email,
      input.unit_label,
      input.monthly_rent_pence,
      input.tenant_type,
      input.status,
      new Date().toISOString(),
    );
  return getTenant(Number(result.lastInsertRowid))!;
}

export function updateTenant(
  id: number,
  input: {
    name: string;
    email: string;
    unit_label: string;
    monthly_rent_pence: number;
    tenant_type: TenantType;
    status: TenantStatus;
  },
) {
  getDb()
    .prepare(
      `UPDATE tenants SET name = ?, email = ?, unit_label = ?, monthly_rent_pence = ?, tenant_type = ?, status = ? WHERE id = ?`,
    )
    .run(
      input.name,
      input.email,
      input.unit_label,
      input.monthly_rent_pence,
      input.tenant_type,
      input.status,
      id,
    );
}

const invoiceSelect = `
  SELECT invoices.*, tenants.name AS tenant_name, tenants.email AS tenant_email,
         tenants.unit_label AS unit_label, tenants.is_sample AS is_sample
  FROM invoices
  JOIN tenants ON tenants.id = invoices.tenant_id
`;

export function listInvoices(): InvoiceWithTenant[] {
  return getDb()
    .prepare(`${invoiceSelect} ORDER BY invoices.issue_date DESC, invoices.id DESC`)
    .all() as InvoiceWithTenant[];
}

export function getInvoice(id: number): InvoiceWithTenant | undefined {
  return getDb()
    .prepare(`${invoiceSelect} WHERE invoices.id = ?`)
    .get(id) as InvoiceWithTenant | undefined;
}

export function getInvoiceByReference(reference: string): InvoiceWithTenant | undefined {
  return getDb()
    .prepare(`${invoiceSelect} WHERE invoices.payment_reference = ?`)
    .get(reference) as InvoiceWithTenant | undefined;
}

export function findInvoiceForPeriod(tenantId: number, periodStart: string): Invoice | undefined {
  return getDb()
    .prepare("SELECT * FROM invoices WHERE tenant_id = ? AND period_start = ?")
    .get(tenantId, periodStart) as Invoice | undefined;
}

export function nextInvoiceNumber(year: number, month: number): string {
  const prefix = `SSI-${String(year).slice(-2)}${String(month).padStart(2, "0")}-`;
  const row = getDb()
    .prepare(
      "SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1",
    )
    .get(`${prefix}%`) as { invoice_number: string } | undefined;
  const next = row
    ? Number.parseInt(row.invoice_number.slice(prefix.length), 10) + 1
    : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function insertInvoice(input: {
  tenant_id: number;
  invoice_number: string;
  period_start: string;
  period_end: string;
  issue_date: string;
  due_date: string;
  amount_pence: number;
  payment_reference: string;
  pdf_path: string | null;
}): Invoice {
  const result = getDb()
    .prepare(
      `INSERT INTO invoices (
        tenant_id, invoice_number, period_start, period_end, issue_date, due_date,
        amount_pence, status, payment_reference, pdf_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
    )
    .run(
      input.tenant_id,
      input.invoice_number,
      input.period_start,
      input.period_end,
      input.issue_date,
      input.due_date,
      input.amount_pence,
      input.payment_reference,
      input.pdf_path,
      new Date().toISOString(),
    );
  return getDb()
    .prepare("SELECT * FROM invoices WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as Invoice;
}

export function updateInvoicePdfPath(id: number, pdfPath: string) {
  getDb().prepare("UPDATE invoices SET pdf_path = ? WHERE id = ?").run(pdfPath, id);
}

export function markInvoiceSent(id: number) {
  getDb()
    .prepare(
      "UPDATE invoices SET status = CASE WHEN status = 'paid' THEN status ELSE 'sent' END, sent_at = ? WHERE id = ?",
    )
    .run(new Date().toISOString(), id);
}

export function markInvoicePaid(id: number, paidAt: string, method: string, notes?: string) {
  const db = getDb();
  const invoice = getInvoice(id);
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "paid") return;
  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare(
      "UPDATE invoices SET status = 'paid', paid_at = ? WHERE id = ?",
    ).run(paidAt, id);
    db.prepare(
      `INSERT INTO payments (invoice_id, amount_pence, paid_at, method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, invoice.amount_pence, paidAt, method, notes ?? null, now);
  })();
}

export function refreshOverdueStatuses(todayISO: string) {
  getDb()
    .prepare(
      `UPDATE invoices SET status = 'overdue'
       WHERE status IN ('draft', 'sent') AND due_date < ?`,
    )
    .run(todayISO);
}

export function unpaidInvoices(): InvoiceWithTenant[] {
  return getDb()
    .prepare(
      `${invoiceSelect} WHERE invoices.status IN ('draft', 'sent', 'overdue') ORDER BY invoices.due_date ASC`,
    )
    .all() as InvoiceWithTenant[];
}

export function invoicesNeedingReminder(kind: 7 | 14, todayISO: string): InvoiceWithTenant[] {
  const column = kind === 7 ? "reminder_7_sent_at" : "reminder_14_sent_at";
  return getDb()
    .prepare(
      `${invoiceSelect}
       WHERE invoices.status IN ('sent', 'overdue')
         AND invoices.${column} IS NULL
         AND date(invoices.issue_date, '+${kind} days') <= date(?)`,
    )
    .all(todayISO) as InvoiceWithTenant[];
}

export function markReminderSent(id: number, kind: 7 | 14) {
  const column = kind === 7 ? "reminder_7_sent_at" : "reminder_14_sent_at";
  getDb()
    .prepare(`UPDATE invoices SET ${column} = ? WHERE id = ?`)
    .run(new Date().toISOString(), id);
}

export function monthStats(periodStart: string) {
  const row = getDb()
    .prepare(
      `SELECT
        COALESCE(SUM(amount_pence), 0) AS invoiced,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_pence ELSE 0 END), 0) AS paid,
        COALESCE(SUM(CASE WHEN status != 'paid' THEN amount_pence ELSE 0 END), 0) AS outstanding,
        COUNT(*) AS count
       FROM invoices WHERE period_start = ?`,
    )
    .get(periodStart) as {
    invoiced: number;
    paid: number;
    outstanding: number;
    count: number;
  };
  const expected = getDb()
    .prepare(
      "SELECT COALESCE(SUM(monthly_rent_pence), 0) AS n FROM tenants WHERE status = 'active'",
    )
    .get() as { n: number };
  return { ...row, expected: expected.n };
}

export function listPayments(): Array<Payment & { invoice_number: string; tenant_name: string; payment_reference: string }> {
  return getDb()
    .prepare(
      `SELECT payments.*, invoices.invoice_number, invoices.payment_reference, tenants.name AS tenant_name
       FROM payments
       JOIN invoices ON invoices.id = payments.invoice_id
       JOIN tenants ON tenants.id = invoices.tenant_id
       ORDER BY payments.paid_at DESC, payments.id DESC`,
    )
    .all() as Array<Payment & { invoice_number: string; tenant_name: string; payment_reference: string }>;
}

export function insertEnquiry(input: {
  name: string;
  email: string;
  phone: string;
  tenant_kind: string;
  use_type: string;
  message: string;
}): Enquiry {
  const result = getDb()
    .prepare(
      `INSERT INTO enquiries (name, email, phone, tenant_kind, use_type, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name,
      input.email,
      input.phone,
      input.tenant_kind,
      input.use_type,
      input.message,
      new Date().toISOString(),
    );
  return getDb()
    .prepare("SELECT * FROM enquiries WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as Enquiry;
}

export function listEnquiries(): Enquiry[] {
  return getDb()
    .prepare("SELECT * FROM enquiries ORDER BY created_at DESC")
    .all() as Enquiry[];
}

export function insertStatementRows(
  batchId: string,
  rows: Array<{
    row_date: string;
    description: string;
    amount_pence: number;
    matched_invoice_id: number | null;
    match_kind: MatchKind | null;
  }>,
): StatementRow[] {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO statement_rows (batch_id, row_date, description, amount_pence, matched_invoice_id, match_kind, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const now = new Date().toISOString();
  const ids: number[] = [];
  db.transaction(() => {
    for (const row of rows) {
      const result = insert.run(
        batchId,
        row.row_date,
        row.description,
        row.amount_pence,
        row.matched_invoice_id,
        row.match_kind,
        now,
      );
      ids.push(Number(result.lastInsertRowid));
    }
  })();
  return db
    .prepare(
      `SELECT * FROM statement_rows WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
    )
    .all(...ids) as StatementRow[];
}

export function getStatementBatch(batchId: string): StatementRow[] {
  return getDb()
    .prepare("SELECT * FROM statement_rows WHERE batch_id = ? ORDER BY id")
    .all(batchId) as StatementRow[];
}

export function updateStatementMatch(
  rowId: number,
  invoiceId: number | null,
  kind: MatchKind,
) {
  getDb()
    .prepare(
      "UPDATE statement_rows SET matched_invoice_id = ?, match_kind = ? WHERE id = ?",
    )
    .run(invoiceId, kind, rowId);
}

export function getStatementRow(id: number): StatementRow | undefined {
  return getDb()
    .prepare("SELECT * FROM statement_rows WHERE id = ?")
    .get(id) as StatementRow | undefined;
}

export function recordJobRun(jobName: string, runFor: string, status: string, detail: string) {
  getDb()
    .prepare(
      "INSERT INTO job_runs (job_name, run_for, status, detail, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(jobName, runFor, status, detail, new Date().toISOString());
}

export function lastJobRun(jobName: string, runFor: string) {
  return getDb()
    .prepare(
      "SELECT * FROM job_runs WHERE job_name = ? AND run_for = ? ORDER BY id DESC LIMIT 1",
    )
    .get(jobName, runFor) as
    | { id: number; status: string; detail: string; created_at: string }
    | undefined;
}
