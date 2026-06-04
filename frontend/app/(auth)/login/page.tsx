"use client";

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

  const demos = [
    { role: "Admin", email: "admin@examflow.com", pw: "admin123" },
    { role: "Teacher", email: "teacher1@examflow.com", pw: "teacher123" },
    { role: "Student", email: "student1@examflow.com", pw: "student123" },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-md p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ExamFlow</h1>
          <p className="text-slate-400 mt-1 text-sm">Online Examination System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@examflow.com" required
              className="input-glass"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" required
              className="input-glass"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 glass-light">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Demo Accounts</p>
          <div className="space-y-1.5">
            {demos.map((demo) => (
              <button
                key={demo.role}
                onClick={() => { setEmail(demo.email); setPassword(demo.pw); setError(""); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/60 transition-colors text-left group"
              >
                <span className="text-xs font-semibold text-slate-500 w-14">{demo.role}</span>
                <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors flex-1">{demo.email}</span>
                <span className="text-xs font-mono text-slate-300">{demo.pw}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-300 mt-2">Click to autofill</p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-300">
          ExamFlow Pro &middot; Java Web Development Capstone
        </p>
      </div>
    </main>
  );
}
