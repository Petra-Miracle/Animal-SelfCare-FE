"use client";

/* Riwayat aktivitas admin/sistem (audit log). */

import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { Card, CardBody } from "@heroui/react";
import { apiErrorMessage, listAuditLogs } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import PaginationBar from "@/components/PaginationBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

const PAGE_SIZE = 20;

export default function AdminAuditPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAuditLogs(page, PAGE_SIZE, token ?? undefined);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat audit log."));
    } finally {
      setLoading(false);
    }
  }, [page, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Audit Log" description="Jejak aktivitas admin & sistem, terbaru di atas." />
      {loading ? (
        <LoadingState label="Memuat audit log…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada aktivitas tercatat" />
      ) : (
        <>
          <div className="space-y-2.5">
            {items.map((l) => (
              <Card key={l.id} className="border border-stone-100 shadow-sm">
                <CardBody className="flex-row items-start gap-3 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600" aria-hidden>
                    <ScrollText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-stone-900">{l.action}</p>
                    <p className="truncate text-xs text-stone-500">
                      {l.entityType} · {l.entityId}
                      {l.actor ? ` · oleh ${l.actor.email}` : " · oleh sistem"}
                    </p>
                    {l.metadata ? (
                      <pre className="mt-1.5 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-stone-50 p-2 font-mono text-[11px] text-stone-600">
                        {JSON.stringify(l.metadata, null, 1)}
                      </pre>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] text-stone-400">{formatDateID(l.createdAt)}</span>
                </CardBody>
              </Card>
            ))}
          </div>
          <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}
    </div>
  );
}
