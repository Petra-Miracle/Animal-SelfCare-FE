"use client";

/* Konteks autentikasi: token disimpan di cookie (bukan localStorage),
   user di-memory + diverifikasi ulang ke GET /auth/me saat aplikasi dimuat. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearToken, fetchMe, getToken, login as apiLogin, setToken } from "./api";
import type { AuthUser, UserRole } from "./types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setLoading(false);
      return;
    }
    setTokenState(t);
    fetchMe(t)
      .then((res) => setUser(res.user))
      .catch(() => {
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setTokenState(null);
      return;
    }
    const res = await fetchMe(t);
    setUser(res.user);
    setTokenState(t);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, login, logout, refresh }),
    [user, token, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}

/** Penjaga halaman: wajib login, dan (opsional) role tertentu. */
export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(user.role === "SUPERADMIN" ? "/admin" : "/fasilitas");
    }
  }, [user, loading, roles, router]);

  if (loading || !user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
