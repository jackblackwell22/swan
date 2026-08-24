import { NextResponse } from "next/server";
import { addEnquiry } from "@/lib/queries";
import { isAcceptingEnquiries } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return {
      name: String(json.name ?? ""),
      email: String(json.email ?? ""),
      phone: String(json.phone ?? ""),
      message: String(json.message ?? ""),
    };
  }
  const form = await request.formData();
  return {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    message: String(form.get("message") ?? ""),
  };
}

export async function POST(request: Request) {
  if (!isAcceptingEnquiries()) {
    return NextResponse.json(
      { error: "Not accepting enquiries. Every lock-up is let at the moment." },
      { status: 403 },
    );
  }

  const body = await readBody(request);
  const name = body.name.trim();
  const email = body.email.trim();
  const phone = body.phone.trim();
  const message = body.message.trim();

  if (!name || !message) {
    return NextResponse.json(
      { error: "Please include your name and a message." },
      { status: 400 },
    );
  }
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Please leave an email address or a phone number so we can reply." },
      { status: 400 },
    );
  }
  if (email && !validEmail(email)) {
    return NextResponse.json(
      { error: "That email address does not look quite right." },
      { status: 400 },
    );
  }

  addEnquiry({ name, email, phone, message });
  return NextResponse.json({ ok: true });
}
