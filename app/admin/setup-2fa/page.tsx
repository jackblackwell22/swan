import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Setup2faForm } from "@/components/admin/setup-2fa-form";
import { getPendingAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Set up two-factor",
};

export default async function Setup2faPage() {
  const pending = await getPendingAuth();
  if (!pending || pending.purpose !== "setup") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-border">
        <p className="text-xs tracking-[0.18em] text-brick uppercase">One-time setup</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl text-ink">
          Authenticator app
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan the square with Google Authenticator, Authy or a similar app, then
          type the six-digit code. You will need this every time you sign in.
        </p>
        <div className="mt-6">
          <Setup2faForm />
        </div>
      </div>
    </div>
  );
}
