"use client";

import { useSession } from "next-auth/react";
import type { SessionUser } from "@/lib/auth/options";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user as SessionUser | undefined;

  return {
    user: user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    roles: user?.roles ?? [],
    permissions: user?.permissions ?? [],
    defaultLocationId: user?.defaultLocationId ?? null,
  };
}
