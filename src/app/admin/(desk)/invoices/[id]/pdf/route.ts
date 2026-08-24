import { NextResponse } from "next/server";
import { getSessionOwner } from "@/lib/auth";
import { getInvoice } from "@/lib/queries";
import { invoicePdfAbsolutePath } from "@/lib/pdf";
import fs from "node:fs";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await getSessionOwner();
  if (!owner) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const { id } = await params;
  const invoice = getInvoice(Number(id));
  if (!invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }
  const abs = invoicePdfAbsolutePath(invoice.pdf_relpath);
  if (!fs.existsSync(abs)) {
    return new NextResponse("PDF missing", { status: 404 });
  }
  const data = fs.readFileSync(abs);
  return new NextResponse(Uint8Array.from(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.payment_reference}.pdf"`,
    },
  });
}
