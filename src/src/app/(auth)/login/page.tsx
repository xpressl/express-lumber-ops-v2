import { LoginForm } from "@/components/auth/login-form";
import { TreePine } from "lucide-react";

export const metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        {/* Subtle lumber-grain pattern overlay */}
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
        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />

        {/* Centered branding on left panel */}
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
          <div className="mt-12 max-w-xs text-center text-sm leading-relaxed opacity-60">
            Operational control platform for inventory, purchasing, sales, and daily management.
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo / Brand - visible on all sizes */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mb-1">
              <TreePine className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Express Lumber
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] font-mono text-muted-foreground">
              Operations
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-xl p-7 shadow-sm">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-muted-foreground/60">
            v0.1.0 &middot; Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
