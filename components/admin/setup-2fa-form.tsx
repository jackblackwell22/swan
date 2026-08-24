"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Setup2faForm() {
  const router = useRouter();
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup-2fa")
      .then(async (response) => {
        const data = (await response.json()) as {
          qr?: string;
          secret?: string;
          error?: string;
        };
        if (!response.ok) {
          setError(data.error || "Please sign in again.");
          return;
        }
        setQr(data.qr || "");
        setSecret(data.secret || "");
      })
      .catch(() => setError("Could not start two-factor setup."));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/setup-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totp: code, secret }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "That code was not right.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {qr ? (
        <div className="flex justify-center rounded-lg bg-white p-4 ring-1 ring-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code for authenticator app" width={220} height={220} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Preparing the QR code…</p>
      )}
      {secret ? (
        <p className="break-all text-center font-mono text-xs text-muted-foreground">
          Or type this key: {secret}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="totp">Code from the app</Label>
        <Input
          id="totp"
          required
          inputMode="numeric"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="h-10 bg-white tracking-[0.3em]"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="h-10 w-full" disabled={busy || !secret}>
        {busy ? "Checking…" : "Turn on two-factor"}
      </Button>
    </form>
  );
}
