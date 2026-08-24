import { parse } from "csv-parse/sync";
import {
  getInvoice,
  insertStatementRows,
  markInvoicePaid,
  unpaidInvoices,
  type InvoiceWithTenant,
  type MatchKind,
  type StatementRow,
} from "@/lib/db";
import { londonDateISO, unitKey } from "@/lib/format";

export type ParsedStatementRow = {
  row_date: string;
  description: string;
  amount_pence: number;
};

const DATE_HEADERS = ["date", "transaction date", "posted", "value date", "completed"];
const DESC_HEADERS = [
  "description",
  "narrative",
  "details",
  "particulars",
  "transaction description",
  "payment details",
];
const AMOUNT_HEADERS = [
  "amount",
  "credit amount",
  "credit",
  "paid in",
  "money in",
  "in",
  "amount credited",
];
const DEBIT_HEADERS = ["debit amount", "debit", "paid out", "money out", "out"];

function normHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_]+/g, " ");
}

function pickColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map(normHeader);
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate);
    if (index >= 0) return headers[index];
  }
  for (const candidate of candidates) {
    const index = normalized.findIndex((h) => h.includes(candidate));
    if (index >= 0) return headers[index];
  }
  return undefined;
}

function parseUKDate(raw: string): string | null {
  const value = raw.trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const uk = value.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (uk) {
    const day = uk[1].padStart(2, "0");
    const month = uk[2].padStart(2, "0");
    let year = uk[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return null;
}

function parseAmountPence(raw: string): number | null {
  const cleaned = raw.replace(/[£,\s]/g, "").trim();
  if (!cleaned) return null;
  const negative = cleaned.startsWith("(") && cleaned.endsWith(")");
  const number = Number.parseFloat(cleaned.replace(/[()]/g, ""));
  if (!Number.isFinite(number)) return null;
  const pence = Math.round(Math.abs(number) * 100);
  return negative ? -pence : pence;
}

export function parseBankCsv(csvText: string): ParsedStatementRow[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
  if (records.length === 0) return [];
  const headers = Object.keys(records[0] ?? {});
  const dateCol = pickColumn(headers, DATE_HEADERS);
  const descCol = pickColumn(headers, DESC_HEADERS);
  const creditCol = pickColumn(headers, AMOUNT_HEADERS);
  const debitCol = pickColumn(headers, DEBIT_HEADERS);
  if (!dateCol || !descCol) {
    throw new Error(
      "Could not find Date and Description columns. Use a typical UK bank CSV export.",
    );
  }

  const rows: ParsedStatementRow[] = [];
  for (const record of records) {
    const date = parseUKDate(record[dateCol] ?? "");
    const description = (record[descCol] ?? "").trim();
    if (!date || !description) continue;
    let amount: number | null = null;
    if (creditCol && debitCol && creditCol !== debitCol) {
      const credit = parseAmountPence(record[creditCol] ?? "") ?? 0;
      const debit = parseAmountPence(record[debitCol] ?? "") ?? 0;
      amount = credit - debit;
    } else if (creditCol) {
      amount = parseAmountPence(record[creditCol] ?? "");
    }
    if (amount === null || amount <= 0) continue;
    rows.push({ row_date: date, description, amount_pence: amount });
  }
  return rows;
}

function normalizeRef(value: string): string {
  return unitKey(value);
}

function findReference(description: string, invoices: InvoiceWithTenant[]): InvoiceWithTenant | undefined {
  const haystack = normalizeRef(description);
  const hits = invoices.filter((invoice) =>
    haystack.includes(normalizeRef(invoice.payment_reference)),
  );
  if (hits.length === 1) return hits[0];
  return undefined;
}

function daysBetween(a: string, b: string): number {
  const ms = Math.abs(Date.parse(a) - Date.parse(b));
  return Math.round(ms / 86_400_000);
}

export type MatchResult = {
  row: ParsedStatementRow;
  invoice: InvoiceWithTenant | null;
  kind: MatchKind;
  note: string;
};

export function matchStatementRows(rows: ParsedStatementRow[]): MatchResult[] {
  const outstanding = unpaidInvoices();
  const used = new Set<number>();
  const results: MatchResult[] = [];

  for (const row of rows) {
    const byRef = findReference(row.description, outstanding);
    if (byRef && !used.has(byRef.id)) {
      if (byRef.amount_pence === row.amount_pence) {
        used.add(byRef.id);
        results.push({
          row,
          invoice: byRef,
          kind: "reference",
          note: `Matched on payment reference ${byRef.payment_reference}.`,
        });
        continue;
      }
      results.push({
        row,
        invoice: byRef,
        kind: "suggested",
        note: `Reference ${byRef.payment_reference} found, but the amount differs (${row.amount_pence / 100} vs invoice ${byRef.amount_pence / 100}). Confirm before marking paid.`,
      });
      continue;
    }

    const amountHits = outstanding.filter(
      (invoice) => invoice.amount_pence === row.amount_pence && !used.has(invoice.id),
    );
    const dated = amountHits.filter(
      (invoice) =>
        daysBetween(row.row_date, invoice.issue_date) <= 21 ||
        daysBetween(row.row_date, invoice.due_date) <= 14,
    );
    const candidates = dated.length > 0 ? dated : amountHits;
    if (candidates.length === 1) {
      results.push({
        row,
        invoice: candidates[0],
        kind: "suggested",
        note: "Amount (and date) look similar. Confirm — this was not matched on the payment reference.",
      });
      continue;
    }
    if (candidates.length > 1) {
      results.push({
        row,
        invoice: null,
        kind: "ambiguous",
        note: `More than one unpaid invoice is for this amount. Not auto-matched.`,
      });
      continue;
    }
    results.push({
      row,
      invoice: null,
      kind: "none",
      note: "No matching unpaid invoice.",
    });
  }
  return results;
}

export function applyStatementMatches(matches: MatchResult[]): {
  batchId: string;
  autoPaid: number;
  suggested: number;
  rows: StatementRow[];
} {
  const batchId = londonDateISO() + "-" + Math.random().toString(36).slice(2, 8);
  const paidAt = londonDateISO();
  let autoPaid = 0;
  let suggested = 0;
  const toInsert = matches.map((match) => {
    if (match.kind === "reference" && match.invoice) {
      const current = getInvoice(match.invoice.id);
      if (current && current.status !== "paid") {
        markInvoicePaid(
          match.invoice.id,
          paidAt,
          "csv",
          `Auto-matched on ${match.invoice.payment_reference} from statement ${batchId}`,
        );
        autoPaid += 1;
      }
    }
    if (match.kind === "suggested") suggested += 1;
    return {
      row_date: match.row.row_date,
      description: match.row.description,
      amount_pence: match.row.amount_pence,
      matched_invoice_id: match.invoice?.id ?? null,
      match_kind: match.kind,
    };
  });
  const rows = insertStatementRows(batchId, toInsert);
  return { batchId, autoPaid, suggested, rows };
}

export function confirmSuggestedMatch(row: StatementRow) {
  if (!row.matched_invoice_id) {
    throw new Error("This row has no suggested invoice to confirm.");
  }
  const invoice = getInvoice(row.matched_invoice_id);
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== "paid") {
    markInvoicePaid(
      invoice.id,
      row.row_date,
      "csv",
      `Confirmed from statement row ${row.id}`,
    );
  }
}
