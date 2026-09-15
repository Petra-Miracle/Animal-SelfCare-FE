"use client";

/* Riwayat aktivitas admin/sistem (audit log). */

import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { Card, CardBody, Code, Skeleton, Tooltip, User as HeroUser } from "@heroui/react";
import { apiErrorMessage, listAuditLogs } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import PaginationBar from "@/components/PaginationBar";
import { EmptyState, ErrorState } from "@/components/States";
import { formatDateID, timeAgoID } from "@/lib/utils";
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
        <div className="space-y-2.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="rounded-3xl">
              <div className="h-20" />
            </Skeleton>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada aktivitas tercatat" />
      ) : (
        <>
          <div className="space-y-2.5">
            {items.map((l) => (
              <Card key={l.id} className="border border-stone-200/70 shadow-card">
                <CardBody className="flex-row items-start gap-3 p-3.5 sm:p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600" aria-hidden>
                    <ScrollText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Code size="sm" className="font-bold">{l.action}</Code>
                      <span className="truncate text-xs text-stone-500">
                        {l.entityType} · {l.entityId}
                      </span>
                    </div>
                    {l.actor ? (
                      <HeroUser
                        name={l.actor.email}
                        description={l.actor.role === "SUPERADMIN" ? "SuperAdmin" : "Admin RS"}
                        avatarProps={{ name: l.actor.email.charAt(0).toUpperCase(), size: "sm", className: "bg-stone-700 text-white" }}
                      />
                    ) : (
                      <p className="text-xs italic text-stone-400">oleh sistem otomatis</p>
                    )}
                    {l.metadata ? (
                      <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-stone-50 p-2.5 font-mono text-[11px] text-stone-600">
                        {JSON.stringify(l.metadata, null, 1)}
                      </pre>
                    ) : null}
                  </div>
                  <Tooltip content={formatDateID(l.createdAt)} placement="left" size="sm">
                    <span className="shrink-0 cursor-help text-[11px] font-medium text-stone-400">{timeAgoID(l.createdAt)}</span>
                  </Tooltip>
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
