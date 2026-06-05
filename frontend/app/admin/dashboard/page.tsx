"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "ADMIN") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/admin/stats").then(r => setStats(r.data.data));
  }, [router]);

  if (!user || !stats) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)" }}>
      Loading…
    </div>
  );

  const cards = [
    { label: "Total Users",  value: stats.totalUsers,    href: "/admin/users" },
    { label: "Teachers",     value: stats.totalTeachers, href: "/admin/users" },
    { label: "Students",     value: stats.totalStudents, href: "/admin/users" },
    { label: "Exam Papers",  value: stats.totalPapers,   href: null },
    { label: "Exams Taken",  value: stats.totalSessions, href: null },
    { label: "Avg Score",    value: stats.systemAvgScore,href: null },
  ];

  const passRate = Math.round(Number(stats.passRate || 0) * 100);

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main style={{ padding: "2.5rem 2rem", maxWidth: "72rem", margin: "0 auto" }} className="animate-fade-in">

        <div style={{ marginBottom: "2.5rem" }}>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-subheading">System overview and management</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
          {cards.map((c, i) => {
            const inner = (
              <div className="card animate-slide-up" style={{ padding: "1.5rem", animationDelay: `${i * 55}ms` }}>
                <p className="section-label" style={{ marginBottom: "0.875rem" }}>{c.label}</p>
                <p className="font-display" style={{ fontSize: "2.5rem", fontWeight: 300, color: "var(--ink-900)", lineHeight: 1 }}>
                  {String(c.value ?? "—")}
                </p>
              </div>
            );
            return c.href
              ? <Link key={c.label} href={c.href} style={{ textDecoration: "none" }}>{inner}</Link>
              : <div key={c.label}>{inner}</div>;
          })}
        </div>

        {/* Pass rate */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p className="section-label">Overall Pass Rate</p>
            <span className="font-display" style={{ fontSize: "1.5rem", fontWeight: 300, color: "var(--ink-900)" }}>
              {passRate}%
            </span>
          </div>
          <div style={{ height: "6px", background: "rgba(212,180,131,0.25)", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${passRate}%`,
              borderRadius: "9999px",
              background: "linear-gradient(90deg, var(--parchment-400), var(--amber-accent))",
              transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <Link href="/admin/users" className="card animate-slide-up" style={{ padding: "1.5rem", textDecoration: "none", animationDelay: "330ms" }}>
            <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 400, color: "var(--ink-900)", marginBottom: "0.375rem" }}>
              User Management
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-300)" }}>View and manage all system users</p>
          </Link>
          <div className="card" style={{ padding: "1.5rem", opacity: 0.5 }}>
            <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 400, color: "var(--ink-900)", marginBottom: "0.375rem" }}>
              System Settings
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-300)" }}>Coming soon</p>
          </div>
        </div>

      </main>
    </>
  );
}