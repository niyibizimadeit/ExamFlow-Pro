"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [fullName, setFullName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [className, setClassName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "STUDENT") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
    api.get("/api/auth/me").then(r => {
      const p = r.data.data;
      setProfile(p);
      setFullName((p.fullName as string) || "");
      setStudentNo((p.studentNo as string) || "");
      setClassName((p.className as string) || "");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const body: Record<string, unknown> = { fullName, studentNo, className };
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setToast({ msg: "Passwords do not match", type: "error" });
          setSaving(false); return;
        }
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      await api.put("/api/auth/me", body);
      setToast({ msg: "Profile updated", type: "success" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      setToast({ msg: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed", type: "error" });
    } finally { setSaving(false); }
  }

  if (!user || !profile) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)" }}>
      Loading…
    </div>
  );

  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", padding: "0.8rem 1rem",
    fontSize: "0.9375rem", borderRadius: "10px", outline: "none",
    border: "1.5px solid rgba(212,180,131,0.5)",
    background: "rgba(253,250,244,0.7)", color: "var(--ink-900)",
    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };
  const disabledInputStyle: React.CSSProperties = { ...inputStyle, opacity: 0.5, cursor: "not-allowed" };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.6875rem", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.12em",
    color: "var(--ink-400, #b8a18a)", marginBottom: "0.5rem",
    fontFamily: "'DM Sans', sans-serif",
  };

  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--amber-accent)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,115,42,0.12)";
  };
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(212,180,131,0.5)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main style={{ padding: "2.5rem 2rem", maxWidth: "42rem", margin: "0 auto" }} className="animate-fade-in">

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div>
            <h1 className="page-heading">My Profile</h1>
            <p className="page-subheading">Manage your personal information</p>
          </div>
          <Link href="/student/dashboard" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--amber-accent)", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={(profile.email as string) || ""} disabled style={disabledInputStyle} />
              <p style={{ fontSize: "0.75rem", color: "var(--ink-300)", marginTop: "0.375rem" }}>Email cannot be changed</p>
            </div>

            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Student No</label>
                <input value={studentNo} onChange={e => setStudentNo(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Class</label>
                <input value={className} onChange={e => setClassName(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(212,180,131,0.25)", paddingTop: "1.25rem" }}>
              <p className="section-label" style={{ marginBottom: "1rem" }}>Change Password</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  { label: "Current Password", value: currentPassword, setter: setCurrentPassword },
                  { label: "New Password",      value: newPassword,     setter: setNewPassword },
                  { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword },
                ].map(f => (
                  <div key={f.label}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type="password" value={f.value} onChange={e => f.setter(e.target.value)}
                      style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%", padding: "0.9375rem", borderRadius: "10px", border: "none",
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.55 : 1,
                fontSize: "0.9375rem", fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                color: "#fdf8f0", marginTop: "0.25rem",
                background: "linear-gradient(135deg, var(--amber-accent), #7a3318)",
                boxShadow: "0 3px 12px rgba(181,115,42,0.28)",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {saving ? "Saving…" : "Update Profile"}
            </button>
          </div>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}