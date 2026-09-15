"use client";

/* Statistik ringkas: total laporan, darurat, breakdown per status,
   rata-rata waktu verifikasi & klaim. Realtime via SSE. */

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Hourglass, Siren, Timer } from "lucide-react";
import { Card, CardBody } from "@heroui/react";
import { apiErrorMessage, fetchStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRealtime } from "@/lib/sse";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import StatusBadge from "@/components/StatusBadge";
import { ALL_STATUSES, msToHumanID } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

export default function AdminStatsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        setStats(await fetchStats(token ?? undefined));
      } catch (e) {
        if (!silent) setError(apiErrorMessage(e, "Gagal memuat statistik."));
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  useRealtime((ev) => {
    if (ev.name.startsWith("report:")) load(true);
  });

  if (loading) return <div><PageHeader title="Statistik" /><LoadingState label="Memuat statistik…" /></div>;
  if (error)
    return (
      <div>
        <PageHeader title="Statistik" />
        <ErrorState message={error} onRetry={() => load()} />
      </div>
    );
  if (!stats)
    return (
      <div>
        <PageHeader title="Statistik" />
        <EmptyState title="Statistik belum tersedia" />
      </div>
    );

  const cards = [
    { icon: ClipboardCheck, label: "Total laporan", value: String(stats.totalReports), tone: "bg-emerald-600" },
    { icon: Siren, label: "Laporan darurat", value: String(stats.totalEmergency), tone: "bg-red-600" },
    { icon: Hourglass, label: "Rata-rata verifikasi", value: msToHumanID(stats.avgTimeToVerifyMs), tone: "bg-sky-600" },
    { icon: Timer, label: "Rata-rata klaim", value: msToHumanID(stats.avgTimeToClaimMs), tone: "bg-amber-600" },
  ];

  return (
    <div>
      <PageHeader
        title="Statistik"
        description="Ringkasan laporan & kecepatan penanganan. Diperbarui otomatis saat ada perubahan."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border border-stone-100 shadow-sm">
            <CardBody className="gap-1 p-4">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-white ${c.tone}`} aria-hidden>
                <c.icon className="h-5 w-5" />
              </span>
              <p className="text-lg font-extrabold text-stone-900 sm:text-2xl">{c.value}</p>
              <p className="text-xs text-stone-500">{c.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-sm font-bold text-stone-900">Rincian per status</h2>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {ALL_STATUSES.map((s) => (
          <div key={s} className="flex items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3">
            <StatusBadge status={s} />
            <span className="text-lg font-extrabold tabular-nums text-stone-900">{stats.byStatus[s] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
