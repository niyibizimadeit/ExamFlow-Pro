"use client";

// hooks/useAuth.ts — Auth state hook for ExamFlow Pro

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getToken,
  setToken,
  clearToken,
  decodeToken,
  getRedirectPath,
  type UserRole,
} from "@/lib/auth";
import api from "@/lib/api";

export interface AuthUser {
  email: string;
  fullName: string;
  role: UserRole;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On mount, try to load user from token
  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = decodeToken(token);
      if (payload && Date.now() < payload.exp * 1000) {
        setUser({
          email: payload.sub,
          fullName: payload.name,
          role: payload.role,
        });
      } else {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { token, role, fullName } = res.data.data;
    setToken(token);
    setUser({ email, fullName, role });
    // Use window.location.href instead of router.push to force a full page reload.
    // This ensures the cookie set above is sent in the HTTP request headers so that
    // the Next.js middleware can read it and allow access to protected routes.
    window.location.href = getRedirectPath(role);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, login, logout };
}
