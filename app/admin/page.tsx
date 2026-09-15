"use client";

/* Statistik ringkas: total laporan, darurat, breakdown per status (Progress),
   rata-rata waktu verifikasi & klaim (Popover penjelasan). Realtime via SSE. */

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Hourglass, Info, Siren, Timer } from "lucide-react";
import { Card, CardBody, CircularProgress, Popover, PopoverContent, PopoverTrigger, Progress, Tooltip } from "@heroui/react";
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

  const emergencyPct = stats.totalReports > 0 ? Math.round((stats.totalEmergency / stats.totalReports) * 100) : 0;

  const cards = [
    { icon: ClipboardCheck, label: "Total laporan", value: String(stats.totalReports), tint: "bg-brand-600", tip: "Seluruh laporan yang pernah masuk." },
    { icon: Siren, label: "Laporan darurat", value: String(stats.totalEmergency), tint: "bg-red-600", tip: "Ditandai darurat oleh pelapor." },
    { icon: Hourglass, label: "Rata-rata verifikasi", value: msToHumanID(stats.avgTimeToVerifyMs), tint: "bg-sky-600", tip: "Rata-rata durasi BARU → DIVERIFIKASI." },
    { icon: Timer, label: "Rata-rata klaim", value: msToHumanID(stats.avgTimeToClaimMs), tint: "bg-amber-600", tip: "Rata-rata durasi DITAWARKAN → DIAMBIL." },
  ];

  return (
    <div>
      <PageHeader
        title="Statistik"
        description="Ringkasan laporan & kecepatan penanganan. Diperbarui otomatis saat ada perubahan."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Tooltip key={c.label} content={c.tip} placement="top" size="sm" showArrow>
            <Card className="cursor-help border border-stone-200/70 shadow-card transition-shadow hover:shadow-lift">
              <CardBody className="gap-1.5 p-4 sm:p-5">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow ${c.tint}`} aria-hidden>
                  <c.icon className="h-5 w-5" />
                </span>
                <p className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">{c.value}</p>
                <p className="text-xs font-medium text-stone-500">{c.label}</p>
              </CardBody>
            </Card>
          </Tooltip>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
        <Card className="border border-stone-200/70 shadow-card">
          <CardBody className="gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-stone-900">Distribusi status</h2>
              <Popover placement="left">
                <PopoverTrigger>
                  <button aria-label="Penjelasan distribusi status" className="rounded-full p-1 text-stone-400 outline-none hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-brand-500">
                    <Info className="h-4 w-4" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-64 p-3 text-xs leading-relaxed text-stone-600">
                  Proporsi setiap status terhadap total laporan. Arahkan kursor ke badge untuk arti tiap status.
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2.5">
              {ALL_STATUSES.map((s) => {
                const count = stats.byStatus[s] ?? 0;
                const pct = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                if (count === 0 && pct === 0) return null;
                return (
                  <div key={s} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={s} />
                      <span className="text-xs font-bold tabular-nums text-stone-700">
                        {count} <span className="font-medium text-stone-400">· {pct}%</span>
                      </span>
                    </div>
                    <Progress value={pct} color="success" size="sm" aria-label={`Porsi status ${s}: ${pct} persen`} />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-stone-200/70 bg-gradient-to-br from-brand-700 to-teal-700 text-white shadow-card">
          <CardBody className="items-center gap-2 p-5 text-center">
            <h2 className="text-sm font-extrabold">Porsi darurat</h2>
            <CircularProgress
              value={emergencyPct}
              size="lg"
              strokeWidth={3}
              showValueLabel
              classNames={{ svg: "text-white", indicator: "stroke-amber-300", track: "stroke-white/20", value: "text-white font-extrabold" }}
              aria-label={`${emergencyPct} persen laporan bersifat darurat`}
            />
            <p className="text-xs leading-relaxed text-white/80">
              {stats.totalEmergency} dari {stats.totalReports} laporan ditandai darurat oleh pelapor.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
