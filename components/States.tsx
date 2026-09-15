"use client";

import { CircleAlert, Inbox } from "lucide-react";
import { Button, Code, Skeleton, Spinner } from "@heroui/react";

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500" role="status" aria-live="polite">
      <Spinner color="success" size="lg" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Skeleton kartu laporan — dipakai saat daftar dimuat ulang. */
export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card">
          <Skeleton className="h-36" disableAnimation={false}>
            <div className="h-36" />
          </Skeleton>
          <div className="space-y-3 p-4">
            <Skeleton className="w-2/5 rounded-full" disableAnimation={false}>
              <div className="h-5" />
            </Skeleton>
            <Skeleton className="w-4/5 rounded-lg" disableAnimation={false}>
              <div className="h-4" />
            </Skeleton>
            <Skeleton className="w-3/5 rounded-lg" disableAnimation={false}>
              <div className="h-4" />
            </Skeleton>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton baris tabel dashboard. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 rounded-3xl border border-stone-200 bg-white p-4 shadow-card" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="rounded-2xl" disableAnimation={false}>
          <div className="h-14" />
        </Skeleton>
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Belum ada data",
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-card">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600" aria-hidden>
        <Inbox className="h-8 w-8" />
      </span>
      <p className="font-bold text-stone-800">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({
  message,
  code,
  onRetry,
}: {
  message: string;
  code?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="h-10 w-10 text-red-500" aria-hidden />
      <p className="max-w-md text-sm font-medium text-red-800">{message}</p>
      {code ? <Code color="danger" size="sm">{code}</Code> : null}
      {onRetry ? (
        <Button color="danger" variant="flat" size="sm" onPress={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}
