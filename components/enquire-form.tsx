"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fieldClass =
  "h-10 w-full rounded-md border-input bg-white text-base md:text-sm";

export function EnquireForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");
    const form = event.currentTarget;
    const body = new FormData(form);
    const response = await fetch("/api/enquire", {
      method: "POST",
      body,
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      setState("error");
      setMessage(data.error || "Something went wrong. Please try again.");
      return;
    }
    setState("sent");
    form.reset();
  }

  if (state === "sent") {
    return (
      <div className="rounded-xl bg-white p-6 ring-1 ring-border sm:p-8">
        <h2 className="text-2xl text-ink">Thank you</h2>
        <p className="mt-3 text-base text-ink/80">
          Your enquiry is with us. We will reply about availability and rent —
          there is no automated waiting list on this site.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => setState("idle")}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl bg-white p-6 ring-1 ring-border sm:p-8">
      <p className="hidden" aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required maxLength={120} className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Telephone (optional)</Label>
        <Input id="phone" name="phone" type="tel" maxLength={40} className={fieldClass} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tenant_kind">I would be a</Label>
          <select
            id="tenant_kind"
            name="tenant_kind"
            required
            className={fieldClass}
            defaultValue="private"
          >
            <option value="private">Private tenant</option>
            <option value="business">Local business</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="use_type">Intended use</Label>
          <select
            id="use_type"
            name="use_type"
            required
            className={fieldClass}
            defaultValue="storage"
          >
            <option value="vehicle">Vehicle</option>
            <option value="storage">Storage</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className="bg-white text-base md:text-sm"
          placeholder="A little about what you need, and when you would like a unit."
        />
      </div>
      {state === "error" ? (
        <p className="text-sm text-destructive">{message}</p>
      ) : null}
      <Button type="submit" size="lg" className="h-11 px-5" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
