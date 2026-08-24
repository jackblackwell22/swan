import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getBusinessConfig } from "@/lib/config";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Owners",
};

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  const config = getBusinessConfig();

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-border">
        <p className="text-xs tracking-[0.18em] text-brick uppercase">Owners only</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl text-ink">
          {config.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the email and password from your configuration file, then
          a code from your authenticator app.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
