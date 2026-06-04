"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const demos = [
  { role: "Admin", email: "admin@examflow.com", pw: "admin123", color: "text-indigo-600" },
  { role: "Teacher", email: "teacher1@examflow.com", pw: "teacher123", color: "text-emerald-600" },
  { role: "Student", email: "student1@examflow.com", pw: "student123", color: "text-amber-600" },
];

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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid credentials";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/80 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ExamFlow</h1>
            <p className="text-slate-500 text-sm mt-1">Online Examination System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="space-y-1">
              {demos.map(demo => (
                <button
                  key={demo.role}
                  onClick={() => { setEmail(demo.email); setPassword(demo.pw); setError(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors text-left"
                >
                  <span className={`text-xs font-semibold w-14 ${demo.color}`}>{demo.role}</span>
                  <span className="text-xs text-slate-500 flex-1">{demo.email}</span>
                  <span className="text-xs font-mono text-slate-300">{demo.pw}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">ExamFlow Pro &middot; Java Web Development Capstone</p>
      </div>
    </main>
  );
}
