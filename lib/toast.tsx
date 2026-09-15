"use client";

/* API toast aplikasi — diimplementasikan di atas Toast bawaan HeroUI (addToast),
   sehingga seluruh pemanggil (success/error/info) tidak perlu berubah. */

import { addToast } from "@heroui/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function AppToastProvider({ children }: { children: ReactNode }) {
  const api = useMemo<ToastApi>(
    () => ({
      success: (message) =>
        addToast({ title: "Berhasil", description: message, color: "success", variant: "flat" }),
      error: (message) =>
        addToast({ title: "Terjadi kesalahan", description: message, color: "danger", variant: "flat" }),
      info: (message) =>
        addToast({ title: "Info", description: message, color: "primary", variant: "flat" }),
    }),
    []
  );

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <AppToastProvider>");
  return ctx;
}
