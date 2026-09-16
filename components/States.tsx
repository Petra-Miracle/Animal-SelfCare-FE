"use client";

import { CircleAlert, Inbox } from "lucide-react";
import { Button, Code, Skeleton, Spinner } from "@heroui/react";

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-txt-muted" role="status" aria-live="polite">
      <Spinner color="primary" size="lg" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <Skeleton className="h-40" disableAnimation={false}>
            <div className="h-40" />
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

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-surface p-4 shadow-card" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="rounded-xl" disableAnimation={false}>
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-subtle text-txt-muted" aria-hidden>
        <Inbox className="h-8 w-8" />
      </span>
      <p className="font-semibold text-txt-primary">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-txt-secondary">{hint}</p> : null}
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
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-emergency/20 bg-emergency-bg px-6 py-12 text-center"
    >
      <CircleAlert className="h-10 w-10 text-emergency" aria-hidden />
      <p className="max-w-md text-sm font-medium text-emergency">{message}</p>
      {code ? <Code color="danger" size="sm">{code}</Code> : null}
      {onRetry ? (
        <Button color="danger" variant="flat" size="sm" onPress={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}
