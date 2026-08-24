import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getBusinessConfig, isDevelopment } from "@/lib/config";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Owners",
};

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  const config = getBusinessConfig();
  const trial = isDevelopment();

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-border">
        <p className="text-xs tracking-[0.18em] text-brick uppercase">Owners only</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl text-ink">
          {config.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your owner email and password.
        </p>
        {trial ? (
          <p className="mt-3 rounded-md bg-cream px-3 py-2 text-sm text-ink">
            Trial sign-in: <span className="font-medium">dad@example.com</span> /{" "}
            <span className="font-medium">change-me-dad</span>
            <br />
            Or <span className="font-medium">son@example.com</span> /{" "}
            <span className="font-medium">change-me-son</span>
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm
            trialEmail={trial ? "dad@example.com" : ""}
            trialPassword={trial ? "change-me-dad" : ""}
          />
        </div>
      </div>
    </div>
  );
}
