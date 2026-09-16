"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle, MapPin, Share2 } from "lucide-react";
import { Button } from "@heroui/react";
import { apiErrorMessage, getPublicReport, reportImageUrl } from "@/lib/api";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { formatDateID, timeAgoID } from "@/lib/utils";
import type { PublicReport } from "@/lib/types";

export default function LaporanDetailPage({ params }: { params: { id: string } }) {
  const toast = useToast();
  const [report, setReport] = useState<PublicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicReport(params.id);
      setReport(res.report);
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat detail laporan."));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime((ev) => {
    if (!ev.name.startsWith("report:")) return;
    const rid = eventReportId(ev.data);
    if (rid && report && rid === report.id) {
      if (ev.name === "report:claimed") {
        toast.info("Laporan ini baru saja diambil oleh fasilitas penangan.");
      } else if (ev.name === "report:status_changed") {
        toast.info("Status laporan ini baru saja berubah.");
      }
      load();
    }
  });

  if (loading) return <div className="pt-8"><LoadingState label="Memuat detail laporan…" /></div>;
  if (error)
    return (
      <div className="space-y-4 pt-8">
        <Button as={Link} href="/laporan" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          Kembali
        </Button>
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  if (!report)
    return (
      <div className="space-y-4 pt-8">
        <Button as={Link} href="/laporan" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          Kembali
        </Button>
        <EmptyState title="Laporan tidak ditemukan" />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/laporan" className="rounded-lg p-2 text-txt-secondary hover:bg-subtle">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-txt-primary font-heading">Detail Laporan</h1>
        </div>
        <button className="rounded-lg p-2 text-txt-secondary hover:bg-subtle" aria-label="Bagikan">
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Photo */}
      {report.images.length > 0 && (
        <div className="relative mt-4">
          <img
            src={reportImageUrl(report.id, report.images[0].id)}
            alt={report.animalTypeGuess ?? "Hewan terlantar"}
            className="h-64 w-full rounded-xl object-cover sm:h-80"
          />
          {report.images.length > 1 && (
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              1 / {report.images.length}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {/* Animal type + status */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-txt-primary font-heading">
            {report.animalTypeGuess ?? "Hewan"}
          </h2>
          <StatusBadge status={report.status} showEmergency={false} />
        </div>

        {/* Darurat badge */}
        {report.isEmergency && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emergency px-4 py-1.5 text-sm font-bold text-white">
            <span aria-hidden>⚠</span> Darurat
          </span>
        )}

        {/* AI Detection */}
        {report.classifications.length > 0 && (
          <div className="rounded-xl bg-primary-light p-3">
            <p className="text-sm font-medium text-primary">
              ✨ Deteksi AI: {report.classifications[0].animalClassName ?? "Tidak diketahui"} ({Math.round((report.classifications[0].confidence ?? 0) * 100)}% yakin)
            </p>
          </div>
        )}

        {/* Condition tags */}
        {report.conditionTags.length > 0 && (
          <div>
            <h3 className="mb-2 font-bold text-txt-primary font-heading">Kondisi Hewan</h3>
            <div className="flex flex-wrap gap-2">
              {report.conditionTags.map((t) => (
                <span key={t} className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-txt-secondary">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location & time */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <div className="flex items-start gap-2 text-sm text-txt-secondary">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{report.locationText}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-txt-secondary">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <span>Dilaporkan {formatDateID(report.foundAt)}</span>
          </div>
        </div>

        {/* Status history */}
        <div>
          <h3 className="mb-4 font-bold text-txt-primary font-heading">Riwayat Status</h3>
          <div className="space-y-0">
            {[
              { label: "Laporan Diterima", active: true },
              { label: "Diverifikasi Admin", active: ["DIVERIFIKASI", "DITAWARKAN", "DIAMBIL", "DALAM_PENANGANAN", "SELESAI"].includes(report.status) },
              { label: "Ditawarkan ke Fasilitas", active: ["DITAWARKAN", "DIAMBIL", "DALAM_PENANGANAN", "SELESAI"].includes(report.status) },
              { label: "Diambil Fasilitas", active: ["DIAMBIL", "DALAM_PENANGANAN", "SELESAI"].includes(report.status) },
              { label: "Dalam Penanganan", active: ["DALAM_PENANGANAN", "SELESAI"].includes(report.status) },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`h-3 w-3 rounded-full ${item.active ? "bg-primary" : "bg-border"}`} />
                  {i < 4 && <div className={`w-0.5 flex-1 ${item.active ? "bg-primary" : "bg-border"}`} />}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${item.active ? "text-primary" : "text-txt-muted"}`}>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
