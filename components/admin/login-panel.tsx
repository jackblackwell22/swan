"use client";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginPanel({ email, password }: { email: string; password: string }) {
  return (
    <div className="mt-6 space-y-6">
      <form method="POST" action="/api/auth/login">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />
        <button
          type="submit"
          className={cn(buttonVariants({ size: "lg" }), "h-12 w-full text-base")}
        >
          Open the owners’ desk
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">or sign in yourself</p>

      <form method="POST" action="/api/auth/login" autoComplete="off" className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email}
            autoComplete="off"
            className="h-10 bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            defaultValue={password}
            autoComplete="off"
            className="h-10 bg-white"
          />
        </div>
        <button type="submit" className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full")}>
          Sign in
        </button>
      </form>
    </div>
  );
}
