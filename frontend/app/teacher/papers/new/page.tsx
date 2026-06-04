"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, decodeToken, clearToken } from "@/lib/auth";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
import Toast from "@/components/Toast";

export default function NewPaperPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMins, setDurationMins] = useState("60");
  const [totalScore, setTotalScore] = useState("100");
  const [passScore, setPassScore] = useState("60");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const payload = decodeToken(token);
    if (!payload || payload.role !== "TEACHER") { clearToken(); router.push("/login"); return; }
    setUser({ fullName: payload.name, role: payload.role });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title, description,
        durationMins: parseInt(durationMins),
        totalScore: parseFloat(totalScore),
        passScore: parseFloat(passScore),
      };
      if (startTime) body.startTime = startTime;
      if (endTime) body.endTime = endTime;

      const res = await api.post("/api/papers", body);
      setToast({ msg: "Paper created!", type: "success" });
      setTimeout(() => router.push(`/teacher/papers/${res.data.data.id}/build`), 800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      setToast({ msg, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <NavBar fullName={user.fullName} role={user.role} />
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Exam Paper</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="e.g. Java Midterm Exam" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Optional description..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
              <input type="number" value={durationMins} onChange={e => setDurationMins(e.target.value)} required className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Score</label>
              <input type="number" value={totalScore} onChange={e => setTotalScore(e.target.value)} required className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pass Score</label>
              <input type="number" value={passScore} onChange={e => setPassScore(e.target.value)} required className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? "Creating…" : "Create & Build Paper"}
          </button>
        </form>
      </main>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
