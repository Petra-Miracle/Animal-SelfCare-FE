"use client";

/* Sistem toast ringan (pengganti library tambahan): animasi Framer Motion,
   daerah live-region agar terbaca screen reader. */

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    counter.current += 1;
    const id = counter.current;
    setItems((prev) => [...prev.slice(-3), { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg"
            >
              {t.kind === "success" ? (
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              ) : t.kind === "error" ? (
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
              ) : (
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden />
              )}
              <p className="text-sm leading-snug text-stone-800">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}
