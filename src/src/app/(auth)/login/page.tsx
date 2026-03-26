import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-2">
            <span className="text-xl font-bold text-primary font-mono">EL</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Express Lumber Ops</h1>
          <p className="text-sm text-muted-foreground">Operational Control System</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-foreground font-mono">
          v0.1.0 &middot; Internal Use Only
        </p>
      </div>
    </div>
  );
}
