"use client";

import { useState, useCallback } from "react";

interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
  id: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastState["type"] = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}