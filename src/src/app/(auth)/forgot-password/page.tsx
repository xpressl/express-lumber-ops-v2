"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { TreePine } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 22px,
              rgba(255,255,255,0.4) 22px,
              rgba(255,255,255,0.4) 23px
            ), repeating-linear-gradient(
              0deg,
              transparent,
              transparent 80px,
              rgba(255,255,255,0.15) 80px,
              rgba(255,255,255,0.15) 81px
            )`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-primary-foreground">
          <TreePine className="h-16 w-16 mb-6 opacity-90" strokeWidth={1.5} />
          <h2
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Express Lumber
          </h2>
          <p className="text-sm uppercase tracking-[0.25em] font-mono opacity-70">
            Operations
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo / Brand */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mb-1">
              <TreePine className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-xl p-7 shadow-sm">
            {submitted ? (
              <div className="text-center space-y-5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-primary"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account exists with that email, a reset link has been sent.
                </p>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full h-12 font-semibold text-sm tracking-wide"
                  >
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-muted/40 focus-visible:ring-[hsl(var(--copper))]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 font-semibold text-sm tracking-wide bg-copper text-copper-foreground hover:bg-copper/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-xs text-muted-foreground hover:text-copper transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground/60">
            v0.1.0 &middot; Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
