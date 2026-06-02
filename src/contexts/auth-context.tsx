"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearSession, persistSession, ssoLoginUrl, ssoLogoutUrl } from "@/lib/auth";
import type { Role, User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  role: Role | null;
  devLogin: (userId: string) => Promise<void>;
  startSSO: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await api.me();
    setUser(u);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const devLogin = useCallback(async (userId: string) => {
    const u = await api.devLogin(userId);
    persistSession(u, `mock.${u.id}`);
    setUser(u);
  }, []);

  const startSSO = useCallback(() => {
    window.location.href = ssoLoginUrl();
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    const out = ssoLogoutUrl();
    if (process.env.NEXT_PUBLIC_USE_MOCK === "false" && out) {
      window.location.href = out;
    } else {
      window.location.href = "/login";
    }
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, role: user?.role ?? null, devLogin, startSSO, logout, refresh }),
    [user, loading, devLogin, startSSO, logout, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth harus di dalam <AuthProvider>");
  return ctx;
}
