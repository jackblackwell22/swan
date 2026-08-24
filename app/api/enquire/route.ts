import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBusinessConfig } from "@/lib/config";
import { ALL_LET_BODY } from "@/lib/enquiries";
import { insertEnquiry, isAcceptingEnquiries, recentFailedLogins, recordLoginAttempt } from "@/lib/db";
import { isSmtpConfigured, sendEnquiryNotification } from "@/lib/email";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  tenant_kind: z.enum(["business", "private"]),
  use_type: z.enum(["vehicle", "storage", "other"]),
  message: z.string().trim().min(10).max(4000),
  website: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  if (!isAcceptingEnquiries()) {
    return NextResponse.json({ error: ALL_LET_BODY }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  if (recentFailedLogins(`enquire:${ip}`, since) >= 8) {
    return NextResponse.json(
      { error: "Please wait a little before sending another enquiry." },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const parsed = schema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    tenant_kind: form.get("tenant_kind"),
    use_type: form.get("use_type"),
    message: form.get("message"),
    website: form.get("website") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form and try again." },
      { status: 400 },
    );
  }
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  insertEnquiry({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    tenant_kind: parsed.data.tenant_kind,
    use_type: parsed.data.use_type,
    message: parsed.data.message,
  });
  recordLoginAttempt(`enquire:${ip}`, true);

  const config = getBusinessConfig();
  if (isSmtpConfigured() && config.email) {
    try {
      await sendEnquiryNotification(parsed.data);
    } catch (error) {
      console.error("enquiry email failed", error);
    }
  }

  return NextResponse.json({ ok: true });
}
