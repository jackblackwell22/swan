import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/admin/login-panel";
import { getBusinessConfig, getAdminSeeds } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Owners",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  getDb();
  if (await getSession()) redirect("/admin");
  const config = getBusinessConfig();
  const trial = getAdminSeeds()[0] ?? {
    email: "dad@example.com",
    password: "change-me-dad",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-sm ring-1 ring-border">
        <p className="text-xs tracking-[0.18em] text-brick uppercase">Owners only</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl text-ink">
          {config.name}
        </h1>
        <div className="mt-5 rounded-lg border-2 border-door bg-[#e8f2fb] p-4 text-ink">
          <p className="text-xs font-semibold tracking-wide text-door uppercase">
            Trial login — no typing needed
          </p>
          <p className="mt-2 text-lg leading-snug">
            Email <span className="font-semibold">{trial.email}</span>
            <br />
            Password <span className="font-semibold">{trial.password}</span>
          </p>
        </div>
        <LoginPanel email={trial.email} password={trial.password} />
      </div>
    </div>
  );
}
