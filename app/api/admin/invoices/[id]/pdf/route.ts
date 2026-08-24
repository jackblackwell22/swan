import fs from "node:fs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInvoice } from "@/lib/db";
import { regeneratePdf } from "@/lib/invoicing";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { id } = await context.params;
  const invoice = getInvoice(Number(id));
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let pdfPath = invoice.pdf_path;
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    pdfPath = await regeneratePdf(invoice.id);
  }
  const bytes = fs.readFileSync(pdfPath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
