"use client";

/* Hitung mundur klaim: ring CircularProgress + angka, berdetak tiap detik. */

import { useEffect, useState } from "react";
import { CircularProgress } from "@heroui/react";

const CLAIM_WINDOW_MS = 20 * 60 * 1000;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function ClaimCountdown({
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
    if (expiresAt && new Date(expiresAt).getTime() <= now) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, now]);

  if (!expiresAt) return <span className="text-sm text-stone-500">-</span>;

  const diff = new Date(expiresAt).getTime() - now;
  const lewat = diff <= 0;
  const mnt = Math.max(0, Math.floor(diff / 60000));
  const dtk = Math.max(0, Math.floor((diff % 60000) / 1000));
  const pct = Math.max(0, Math.min(100, (diff / CLAIM_WINDOW_MS) * 100));

  return (
    <span className="inline-flex items-center gap-2.5" role="timer" aria-live={lewat ? "assertive" : "off"}>
      <CircularProgress
        value={lewat ? 0 : pct}
        size="md"
        strokeWidth={3}
        color={lewat ? "danger" : pct < 25 ? "warning" : "success"}
        showValueLabel={false}
        aria-label={lewat ? "Batas waktu habis" : `Sisa waktu ${mnt} menit ${dtk} detik`}
      />
      <span
        className={
          lewat
            ? "rounded-xl bg-red-100 px-3 py-1.5 font-mono text-sm font-extrabold text-red-700"
            : "rounded-xl bg-amber-100 px-3 py-1.5 font-mono text-sm font-extrabold tabular-nums text-amber-800"
        }
      >
        {lewat ? "Tenggat lewat" : `${pad(mnt)}:${pad(dtk)}`}
      </span>
    </span>
  );
}
