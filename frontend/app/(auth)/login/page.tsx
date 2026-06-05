"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const demos = [
  { role: "Admin",   email: "admin@examflow.com",    pw: "admin123"   },
  { role: "Teacher", email: "teacher1@examflow.com", pw: "teacher123" },
  { role: "Student", email: "student1@examflow.com", pw: "student123" },
];

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || "Invalid credentials";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "0.9375rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(212,180,131,0.5)",
    background: "rgba(253,250,244,0.7)",
    color: "var(--ink-900)",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "var(--ink-400, #b8a18a)",
    marginBottom: "0.5rem",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      {/* Background rings */}
      <div aria-hidden style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10rem", left: "-10rem",
          width: "32rem", height: "32rem", borderRadius: "9999px", opacity: 0.35,
          background: "radial-gradient(circle, var(--parchment-300), transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-8rem", right: "-8rem",
          width: "26rem", height: "26rem", borderRadius: "9999px", opacity: 0.22,
          background: "radial-gradient(circle, var(--amber-accent), transparent 70%)",
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>

        {/* Main card */}
        <div
          className="card animate-slide-up"
          style={{ padding: "2.5rem 2.25rem", boxShadow: "0 8px 40px rgba(28,22,18,0.12), inset 0 1px 0 rgba(255,255,255,0.8)" }}
        >

          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2.25rem" }}>
            <div style={{
              width: "4rem", height: "4rem", borderRadius: "18px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "1.25rem",
              background: "linear-gradient(145deg, var(--parchment-300) 0%, var(--amber-accent) 100%)",
              boxShadow: "0 6px 20px rgba(181,115,42,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="rgba(253,248,240,0.96)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="font-display" style={{
              fontSize: "2.25rem", fontWeight: 300, letterSpacing: "-0.02em",
              color: "var(--ink-900)", margin: 0, lineHeight: 1.1,
            }}>
              ExamFlow
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-300)", marginTop: "0.375rem" }}>
              Online Examination System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            <div>
              <label htmlFor="email" style={labelStyle}>Email address</label>
              <input
                id="email" type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "var(--amber-accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,115,42,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "rgba(212,180,131,0.5)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>Password</label>
              <input
                id="password" type="password" value={password} required
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "var(--amber-accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,115,42,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "rgba(212,180,131,0.5)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {error && (
              <div style={{
                fontSize: "0.875rem", padding: "0.75rem 1rem", borderRadius: "10px",
                border: "1px solid rgba(168,84,56,0.22)",
                background: "rgba(168,84,56,0.07)", color: "var(--terracotta)",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.9375rem 1.5rem",
                fontSize: "0.9375rem",
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.02em",
                borderRadius: "10px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.55 : 1,
                color: "#fdf8f0",
                background: "linear-gradient(135deg, var(--amber-accent) 0%, #7a3318 100%)",
                boxShadow: "0 3px 12px rgba(181,115,42,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                marginTop: "0.25rem",
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(181,115,42,0.40), inset 0 1px 0 rgba(255,255,255,0.18)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 3px 12px rgba(181,115,42,0.32), inset 0 1px 0 rgba(255,255,255,0.18)";
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{
            marginTop: "1.75rem",
            borderRadius: "12px",
            border: "1px solid rgba(212,180,131,0.28)",
            background: "rgba(249,242,227,0.45)",
            padding: "1rem 1.125rem",
          }}>
            <p style={{
              fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.14em", color: "var(--ink-300)",
              fontFamily: "'DM Sans', sans-serif", marginBottom: "0.625rem",
            }}>
              Demo Accounts
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {demos.map(demo => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => { setEmail(demo.email); setPassword(demo.pw); setError(""); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.5rem 0.625rem", borderRadius: "8px", textAlign: "left",
                    background: "transparent", border: "none", cursor: "pointer",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.18)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, width: "4rem", color: "var(--amber-accent)", fontFamily: "'DM Sans', sans-serif" }}>
                    {demo.role}
                  </span>
                  <span style={{ fontSize: "0.8125rem", flex: 1, color: "var(--ink-500)", fontFamily: "'DM Sans', sans-serif" }}>
                    {demo.email}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--ink-300)" }}>
                    {demo.pw}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "1.25rem" }}>
          ExamFlow &middot; Java Web Development Capstone
        </p>
      </div>
    </main>
  );
}