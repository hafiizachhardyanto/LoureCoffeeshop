"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const typeClasses = {
    success: "alert-success",
    error: "alert-error",
    info: "alert-info",
    warning: "alert-warning",
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in">
      <div className={`alert ${typeClasses[type]} shadow-lg`}>
        <span>{message}</span>
        <button onClick={() => setVisible(false)} className="btn btn-ghost btn-sm">
          ✕
        </button>
      </div>
    </div>
  );
}