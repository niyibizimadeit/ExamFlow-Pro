"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [users, setUsers] = useState<{
    id: number; username: string; email: string;
    fullName: string; role: string; enabled: boolean; createdAt: string;
  }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "ADMIN") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/admin/users").then(r => setUsers(r.data.data));
  }, [router]);

  if (!user) return null;

  const roleBadge = (r: string) => {
    const map: Record<string, React.CSSProperties> = {
      ADMIN:   { background: "rgba(168,84,56,0.10)", color: "var(--terracotta)", border: "1px solid rgba(168,84,56,0.22)" },
      TEACHER: { background: "rgba(181,115,42,0.10)", color: "var(--amber-accent)", border: "1px solid rgba(181,115,42,0.25)" },
      STUDENT: { background: "rgba(134,168,102,0.12)", color: "#4a6e30", border: "1px solid rgba(134,168,102,0.30)" },
    };
    return map[r] || map.STUDENT;
  };

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main style={{ padding: "2.5rem 2rem", maxWidth: "72rem", margin: "0 auto" }} className="animate-fade-in">

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div>
            <h1 className="page-heading">User Management</h1>
            <p className="page-subheading">{users.length} users registered</p>
          </div>
          <Link href="/admin/dashboard" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>

        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,180,131,0.25)" }}>
                {["User", "Email", "Role", "Status", "Joined"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "0.875rem 1.25rem",
                    fontSize: "0.6875rem", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.12em",
                    color: "var(--ink-300)", fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: i < users.length - 1 ? "1px solid rgba(212,180,131,0.15)" : "none",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,180,131,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span className="font-display" style={{ fontSize: "1rem", fontWeight: 400, color: "var(--ink-900)" }}>
                      {u.fullName}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "var(--ink-500)" }}>{u.email}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.625rem",
                      borderRadius: "9999px", fontFamily: "'DM Sans', sans-serif",
                      ...roleBadge(u.role),
                    }}>
                      {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{
                      fontSize: "0.8125rem", fontWeight: 500,
                      color: u.enabled ? "#4a6e30" : "var(--terracotta)",
                    }}>
                      {u.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8125rem", color: "var(--ink-300)" }}>
                    {String(u.createdAt).split("T")[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </>
  );
}