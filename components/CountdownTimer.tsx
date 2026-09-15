"use client";

import { useEffect, useState } from "react";
import { countdownText, isExpired } from "@/lib/utils";

/* Hitung mundur batas konfirmasi klaim 20 menit (field claimExpiresAt).
   Berdetak tiap detik; saat lewat, memanggil onExpire sekali. */
export default function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string | null | undefined;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (expiresAt && isExpired(expiresAt, now)) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, now]);

  if (!expiresAt) return <span className="text-sm text-stone-500">-</span>;
  const lewat = isExpired(expiresAt, now);
  return (
    <span
      role="timer"
      aria-live={lewat ? "assertive" : "off"}
      className={
        lewat
          ? "rounded-lg bg-red-100 px-3 py-1.5 font-mono text-sm font-bold text-red-700"
          : "rounded-lg bg-amber-100 px-3 py-1.5 font-mono text-sm font-bold text-amber-800"
      }
    >
      {countdownText(expiresAt, now)}
    </span>
  );
}
