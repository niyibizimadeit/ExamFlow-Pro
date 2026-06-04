"use client";

// app/(auth)/login/page.tsx — Login page (Phase 2 — wired to backend)

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-md">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">ExamFlow Pro</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Online Exam & Intelligent Test Assembly
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@examflow.com"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Demo Credentials
          </p>
          <div className="space-y-2 text-xs">
            {[
              { role: "Admin", email: "admin@examflow.com", pw: "admin123", color: "text-red-600" },
              { role: "Teacher", email: "teacher1@examflow.com", pw: "teacher123", color: "text-blue-600" },
              { role: "Student", email: "student1@examflow.com", pw: "student123", color: "text-green-600" },
            ].map((demo) => (
              <div
                key={demo.role}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition"
                onClick={() => { setEmail(demo.email); setPassword(demo.pw); }}
              >
                <span className={`font-semibold w-14 ${demo.color}`}>{demo.role}</span>
                <span className="text-gray-600">{demo.email}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-500 font-mono">{demo.pw}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Click a row to auto-fill</p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          ExamFlow Pro · Java Web Development Capstone · Taizhou University
        </p>
      </div>
    </main>
  );
}
