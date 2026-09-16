"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, FileText, Hourglass, Timer, TrendingUp } from "lucide-react";
import { apiErrorMessage, fetchStats, listAdminReports } from "@/lib/api";
import type { ReportListParams } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRealtime } from "@/lib/sse";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { msToHumanID, timeAgoID } from "@/lib/utils";
import type { AdminReport, DashboardStats } from "@/lib/types";

export default function AdminStatsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const [s, r] = await Promise.all([
          fetchStats(token ?? undefined),
          listAdminReports({ page: 1, pageSize: 5, sort: "newest" } as ReportListParams, token ?? undefined),
        ]);
        setStats(s);
        setRecentReports(r.items);
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

  if (loading) return <LoadingState label="Memuat statistik…" />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;
  if (!stats) return <EmptyState title="Statistik belum tersedia" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-txt-secondary">
          Ringkasan aktivitas penanganan hewan terlantar di Kota Kupang.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: FileText, label: "Total Laporan", value: stats.totalReports.toLocaleString("id-ID"), color: "text-primary" },
          { icon: Clock, label: "Menunggu Verifikasi", value: (stats.byStatus?.BARU ?? 0).toLocaleString("id-ID"), color: "text-info" },
          { icon: TrendingUp, label: "Dalam Penanganan", value: (stats.byStatus?.DALAM_PENANGANAN ?? 0).toLocaleString("id-ID"), color: "text-accent" },
          { icon: Hourglass, label: "Selesai Ditangani", value: (stats.byStatus?.SELESAI ?? 0).toLocaleString("id-ID"), color: "text-success" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-subtle ${card.color}`}>
              <card.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 text-2xl font-bold text-txt-primary font-heading">{card.value}</p>
            <p className="text-sm text-txt-secondary">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-subtle text-accent">
              <Timer className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-2xl font-bold text-txt-primary font-heading">{msToHumanID(stats.avgTimeToVerifyMs)}</p>
              <p className="text-sm text-txt-secondary">Rata-rata Waktu Verifikasi</p>
              <p className="text-xs text-txt-muted">Target internal: di bawah 15 menit</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-subtle text-accent">
              <Hourglass className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-2xl font-bold text-txt-primary font-heading">{msToHumanID(stats.avgTimeToClaimMs)}</p>
              <p className="text-sm text-txt-secondary">Rata-rata Waktu Klaim Fasilitas</p>
              <p className="text-xs text-txt-muted">Dihitung dari laporan ditawarkan hingga diambil</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent reports table */}
      <div className="rounded-xl border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-bold text-txt-primary font-heading">Laporan Terbaru</h2>
          <Link href="/admin/laporan" className="text-sm font-semibold text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>
        {recentReports.length === 0 ? (
          <div className="p-8 text-center text-sm text-txt-muted">Belum ada laporan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-txt-muted">
                  <th className="px-4 py-3 font-medium">Hewan</th>
                  <th className="px-4 py-3 font-medium">Lokasi</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-subtle/50">
                    <td className="px-4 py-3 font-medium text-txt-primary">{r.animalTypeGuess ?? "Hewan"}</td>
                    <td className="px-4 py-3 text-txt-secondary">{r.locationText}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-txt-muted">{timeAgoID(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
