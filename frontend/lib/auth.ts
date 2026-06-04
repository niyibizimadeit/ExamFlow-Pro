// lib/auth.ts — JWT token helpers for ExamFlow Pro

const TOKEN_KEY = "examflow_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

interface JwtPayload {
  sub: string;       // email
  role: UserRole;
  name: string;
  exp: number;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function decodeRole(token: string): UserRole | null {
  return decodeToken(token)?.role ?? null;
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":   return "/admin/dashboard";
    case "TEACHER": return "/teacher/dashboard";
    case "STUDENT": return "/student/dashboard";
  }
}
