"use client";

import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";
import { Button, Spinner } from "@heroui/react";

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500" role="status" aria-live="polite">
      <Spinner color="success" size="lg" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function LoadingInline() {
  return <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />;
}

export function EmptyState({
  title = "Belum ada data",
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
      <Inbox className="h-10 w-10 text-stone-300" aria-hidden />
      <p className="font-semibold text-stone-700">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="h-10 w-10 text-red-500" aria-hidden />
      <p className="max-w-md text-sm font-medium text-red-800">{message}</p>
      {onRetry ? (
        <Button color="danger" variant="flat" size="sm" onPress={onRetry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}
