"use server";

import { redirect } from "next/navigation";
import { lookupAdmin, setSession, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type LoginState = { error: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  getDb();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email.includes("@") || !password) {
    return { error: "Enter your email and password." };
  }
  const admin = lookupAdmin(email);
  if (!admin || !(await verifyPassword(admin, password))) {
    return { error: "Those details were not recognised." };
  }
  await setSession({ adminId: admin.id, email: admin.email });
  redirect("/admin");
}
