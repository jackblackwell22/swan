"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState<"password" | "totp">("password");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as {
      next?: string;
      error?: string;
    };
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not sign in.");
      return;
    }
    if (data.next === "totp") {
      setStep("totp");
      return;
    }
    if (data.next === "setup") {
      router.push("/admin/setup-2fa");
      router.refresh();
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function submitTotp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totp }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not sign in.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={step === "password" ? submitPassword : submitTotp}
      className="space-y-4"
    >
      {step === "password" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 bg-white"
            />
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="totp">Authenticator code</Label>
          <Input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={totp}
            onChange={(event) => setTotp(event.target.value)}
            className="h-10 bg-white tracking-[0.3em]"
            placeholder="000000"
          />
          <p className="text-xs text-muted-foreground">
            Open the authenticator app on your phone and type the six-digit code.
          </p>
        </div>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="h-10 w-full" disabled={busy}>
        {busy ? "Please wait…" : step === "totp" ? "Confirm code" : "Continue"}
      </Button>
    </form>
  );
}
