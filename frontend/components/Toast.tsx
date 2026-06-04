"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";
  const bg = isSuccess
    ? "bg-white/90 backdrop-blur-lg border border-emerald-200 text-emerald-700"
    : "bg-white/90 backdrop-blur-lg border border-red-200 text-red-700";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl transition-all duration-300 ${bg} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />
        {message}
      </div>
    </div>
  );
}
