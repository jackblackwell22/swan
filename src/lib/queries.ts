import { GARAGE_UNITS, LANDLORDS } from "./constants";
import { getDb, type EnquiryRow, type InvoiceRow, type LandlordRow } from "./db";
import { isoNow } from "./london";

export function listLandlords() {
  const db = getDb();
  return LANDLORDS.map((landlord) => {
    const row = db
      .prepare(`SELECT * FROM landlords WHERE id = ?`)
      .get(landlord.id) as LandlordRow;
    return row;
  });
}

export function updateLandlord(
  id: string,
  fields: {
    postal_address: string;
    bacs_account_name: string;
    bacs_sort_code: string;
    bacs_account_number: string;
    from_email: string;
  },
) {
  getDb()
    .prepare(
      `UPDATE landlords
       SET postal_address = ?, bacs_account_name = ?, bacs_sort_code = ?,
           bacs_account_number = ?, from_email = ?
       WHERE id = ?`,
    )
    .run(
      fields.postal_address.trim(),
      fields.bacs_account_name.trim(),
      fields.bacs_sort_code.trim(),
      fields.bacs_account_number.trim(),
      fields.from_email.trim(),
      id,
    );
}

export function listGarages() {
  return getDb()
    .prepare(
      `SELECT g.unit, g.landlord_id, t.id AS tenant_id, t.name AS tenant_name, tn.rent_pence
       FROM garages g
       LEFT JOIN tenancies tn ON tn.garage_unit = g.unit AND tn.ended_at IS NULL
       LEFT JOIN tenants t ON t.id = tn.tenant_id
       ORDER BY g.unit`,
    )
    .all() as {
    unit: number;
    landlord_id: string | null;
    tenant_id: number | null;
    tenant_name: string | null;
    rent_pence: number | null;
  }[];
}

export function setGarageLandlord(unit: number, landlordId: string | null) {
  if (!GARAGE_UNITS.includes(unit as (typeof GARAGE_UNITS)[number])) {
    throw new Error("Unknown garage");
  }
  getDb()
    .prepare(`UPDATE garages SET landlord_id = ? WHERE unit = ?`)
    .run(landlordId, unit);
}

export function listTenants() {
  const db = getDb();
  const tenants = db
    .prepare(`SELECT * FROM tenants ORDER BY name COLLATE NOCASE`)
    .all() as {
    id: number;
    name: string;
    email: string;
    notes: string;
    created_at: string;
  }[];
  const lets = db
    .prepare(
      `SELECT tenant_id, garage_unit, rent_pence
       FROM tenancies WHERE ended_at IS NULL ORDER BY garage_unit`,
    )
    .all() as { tenant_id: number; garage_unit: number; rent_pence: number }[];
  return tenants.map((tenant) => ({
    ...tenant,
    garages: lets.filter((row) => row.tenant_id === tenant.id),
  }));
}

export function getTenant(id: number) {
  const tenant = getDb()
    .prepare(`SELECT * FROM tenants WHERE id = ?`)
    .get(id) as
    | {
        id: number;
        name: string;
        email: string;
        notes: string;
        created_at: string;
      }
    | undefined;
  if (!tenant) return null;
  const garages = getDb()
    .prepare(
      `SELECT garage_unit, rent_pence FROM tenancies
       WHERE tenant_id = ? AND ended_at IS NULL ORDER BY garage_unit`,
    )
    .all(id) as { garage_unit: number; rent_pence: number }[];
  return { ...tenant, garages };
}

export function createTenant(fields: {
  name: string;
  email: string;
  notes: string;
}) {
  const info = getDb()
    .prepare(
      `INSERT INTO tenants (name, email, notes, created_at) VALUES (?, ?, ?, ?)`,
    )
    .run(fields.name.trim(), fields.email.trim(), fields.notes.trim(), isoNow());
  return Number(info.lastInsertRowid);
}

export function updateTenant(
  id: number,
  fields: { name: string; email: string; notes: string },
) {
  getDb()
    .prepare(`UPDATE tenants SET name = ?, email = ?, notes = ? WHERE id = ?`)
    .run(fields.name.trim(), fields.email.trim(), fields.notes.trim(), id);
}

export function assignGarages(
  tenantId: number,
  assignments: { unit: number; rent_pence: number }[],
) {
  const db = getDb();
  const wanted = new Set(assignments.map((item) => item.unit));
  const tx = db.transaction(() => {
    const current = db
      .prepare(
        `SELECT id, garage_unit FROM tenancies WHERE tenant_id = ? AND ended_at IS NULL`,
      )
      .all(tenantId) as { id: number; garage_unit: number }[];

    for (const row of current) {
      if (!wanted.has(row.garage_unit)) {
        db.prepare(`UPDATE tenancies SET ended_at = ? WHERE id = ?`).run(
          isoNow(),
          row.id,
        );
      }
    }

    for (const item of assignments) {
      const occupant = db
        .prepare(
          `SELECT tenant_id FROM tenancies
           WHERE garage_unit = ? AND ended_at IS NULL`,
        )
        .get(item.unit) as { tenant_id: number } | undefined;
      if (occupant && occupant.tenant_id !== tenantId) {
        throw new Error(`Lock-up ${item.unit} is already let to another tenant.`);
      }

      const existing = current.find((row) => row.garage_unit === item.unit);
      if (existing) {
        db.prepare(`UPDATE tenancies SET rent_pence = ? WHERE id = ?`).run(
          item.rent_pence,
          existing.id,
        );
      } else {
        db.prepare(
          `INSERT INTO tenancies (tenant_id, garage_unit, rent_pence, started_at, ended_at)
           VALUES (?, ?, ?, ?, NULL)`,
        ).run(tenantId, item.unit, item.rent_pence, isoNow());
      }
    }
  });
  tx();
}

export function listEnquiries() {
  return getDb()
    .prepare(`SELECT * FROM enquiries ORDER BY id DESC`)
    .all() as EnquiryRow[];
}

export function addEnquiry(fields: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO enquiries (name, email, phone, message, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      fields.name.trim(),
      fields.email.trim(),
      fields.phone.trim(),
      fields.message.trim(),
      isoNow(),
    );
}

export function listInvoices(year?: number, month?: number) {
  const db = getDb();
  if (year && month) {
    return db
      .prepare(
        `SELECT i.*, t.name AS tenant_name, l.name AS landlord_name
         FROM invoices i
         JOIN tenants t ON t.id = i.tenant_id
         JOIN landlords l ON l.id = i.landlord_id
         WHERE i.year = ? AND i.month = ?
         ORDER BY i.id DESC`,
      )
      .all(year, month) as (InvoiceRow & {
      tenant_name: string;
      landlord_name: string;
    })[];
  }
  return db
    .prepare(
      `SELECT i.*, t.name AS tenant_name, l.name AS landlord_name
       FROM invoices i
       JOIN tenants t ON t.id = i.tenant_id
       JOIN landlords l ON l.id = i.landlord_id
       ORDER BY i.year DESC, i.month DESC, i.id DESC`,
    )
    .all() as (InvoiceRow & { tenant_name: string; landlord_name: string })[];
}

export function getInvoice(id: number) {
  return (
    (getDb()
      .prepare(
        `SELECT i.*, t.name AS tenant_name, t.email AS tenant_email, l.name AS landlord_name
         FROM invoices i
         JOIN tenants t ON t.id = i.tenant_id
         JOIN landlords l ON l.id = i.landlord_id
         WHERE i.id = ?`,
      )
      .get(id) as
      | (InvoiceRow & {
          tenant_name: string;
          tenant_email: string;
          landlord_name: string;
        })
      | undefined) ?? null
  );
}

export function invoiceLines(invoiceId: number) {
  return getDb()
    .prepare(
      `SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY garage_unit`,
    )
    .all(invoiceId) as {
    id: number;
    invoice_id: number;
    garage_unit: number;
    description: string;
    amount_pence: number;
  }[];
}
