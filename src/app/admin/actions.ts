"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canOpenDevDesk,
  clearOwnerSession,
  getOwnerAccounts,
  requireOwner,
  setOwnerSession,
  verifyOwnerLogin,
} from "@/lib/auth";
import { GARAGE_UNITS, LANDLORDS } from "@/lib/constants";
import { emailInvoice, runMonthlyInvoices } from "@/lib/invoices";
import { penceFromPoundsInput } from "@/lib/money";
import {
  assignGarages,
  createTenant,
  setGarageLandlord,
  updateLandlord,
  updateTenant,
} from "@/lib/queries";
import { isLandlordId } from "@/lib/references";
import { setAcceptingEnquiries, setFromEmail } from "@/lib/settings";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const owner = verifyOwnerLogin(username, password);
  if (!owner) {
    redirect("/admin/login?error=1");
  }
  await setOwnerSession(owner);
  redirect("/admin");
}

export async function logoutAction() {
  await clearOwnerSession();
  redirect("/admin/login");
}

export async function openOwnersDeskAction() {
  if (!canOpenDevDesk()) {
    redirect("/admin/login?error=1");
  }
  const accounts = getOwnerAccounts();
  await setOwnerSession(accounts[0].id);
  redirect("/admin");
}

export async function saveAcceptingAction(formData: FormData) {
  await requireOwner();
  setAcceptingEnquiries(formData.get("accepting") === "on");
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/garages");
}

export async function saveGaragesAction(formData: FormData) {
  await requireOwner();
  for (const unit of GARAGE_UNITS) {
    const raw = String(formData.get(`landlord_${unit}`) ?? "");
    if (raw === "" || raw === "unset") {
      setGarageLandlord(unit, null);
    } else if (isLandlordId(raw)) {
      setGarageLandlord(unit, raw);
    }
  }
  for (const landlord of LANDLORDS) {
    updateLandlord(landlord.id, {
      postal_address: String(formData.get(`${landlord.id}_postal_address`) ?? ""),
      bacs_account_name: String(formData.get(`${landlord.id}_bacs_account_name`) ?? ""),
      bacs_sort_code: String(formData.get(`${landlord.id}_bacs_sort_code`) ?? ""),
      bacs_account_number: String(
        formData.get(`${landlord.id}_bacs_account_number`) ?? "",
      ),
    });
  }
  setFromEmail(String(formData.get("from_email") ?? ""));
  setAcceptingEnquiries(formData.get("accepting") === "on");
  revalidatePath("/", "layout");
  revalidatePath("/admin/garages");
  redirect("/admin/garages?saved=1");
}

function assignmentsFromForm(formData: FormData) {
  const assignments: { unit: number; rent_pence: number }[] = [];
  for (const unit of GARAGE_UNITS) {
    if (formData.get(`garage_${unit}`) !== "on") continue;
    const pence = penceFromPoundsInput(String(formData.get(`rent_${unit}`) ?? ""));
    if (pence === null) {
      throw new Error(`Enter the monthly rent for lock-up ${unit}.`);
    }
    assignments.push({ unit, rent_pence: pence });
  }
  return assignments;
}

export async function saveTenantAction(formData: FormData) {
  await requireOwner();
  const idRaw = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name) {
    const target = idRaw ? `/admin/tenants/${idRaw}` : "/admin/tenants/new";
    redirect(`${target}?error=name`);
  }

  let id = Number(idRaw);
  try {
    const assignments = assignmentsFromForm(formData);
    if (!idRaw) {
      id = createTenant({ name, email, notes });
    } else {
      updateTenant(id, { name, email, notes });
    }
    assignGarages(id, assignments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save";
    const target = idRaw ? `/admin/tenants/${idRaw}` : "/admin/tenants/new";
    redirect(`${target}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/tenants");
  revalidatePath("/admin/garages");
  revalidatePath("/admin");
  redirect(`/admin/tenants/${id}?saved=1`);
}

export async function generateThisMonthAction() {
  await requireOwner();
  await runMonthlyInvoices();
  revalidatePath("/admin");
  revalidatePath("/admin/invoices");
  redirect("/admin?generated=1");
}

export async function resendInvoiceAction(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("id"));
  await emailInvoice(id);
  revalidatePath("/admin");
  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices?resent=${id}`);
}
