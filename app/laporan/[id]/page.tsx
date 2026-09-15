"use client";

/* Detail laporan publik: tanpa kontak pelapor & tanpa koordinat presisi.
   SSE: jika status laporan ini berubah, tampilkan toast + refresh otomatis. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Camera, MapPin, PawPrint, Tag } from "lucide-react";
import { Button, Card, CardBody, Chip, Divider } from "@heroui/react";
import { apiErrorMessage, getPublicReport } from "@/lib/api";
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
    <div className="mx-auto max-w-3xl space-y-5 pt-6 sm:pt-8">
      <Button as={Link} href="/laporan" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
        Daftar laporan
      </Button>

      <Card>
        <CardBody className="gap-4 p-5 sm:p-6">
          <StatusBadge status={report.status} showEmergency={report.isEmergency} />
          <h1 className="flex items-start gap-2 text-lg font-bold leading-snug text-stone-900 sm:text-xl">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
            {report.locationText}
          </h1>
          <p className="text-xs text-stone-500">
            {report.regionCity} · Dilaporkan {timeAgoID(report.createdAt)} ({formatDateID(report.createdAt)})
          </p>
          <Divider />

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-500">Jenis hewan (perkiraan pelapor)</dt>
                <dd className="font-medium text-stone-900">{report.animalTypeGuess || "Belum diketahui"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-500">Waktu penemuan</dt>
                <dd className="font-medium text-stone-900">{formatDateID(report.foundAt)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-500">Jumlah</dt>
                <dd className="font-medium text-stone-900">{report.animalCount} ekor</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              <div>
                <dt className="text-xs text-stone-500">Foto terlampir</dt>
                <dd className="font-medium text-stone-900">{report.images.length} foto</dd>
              </div>
            </div>
          </dl>

          {report.conditionTags.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-stone-500">Tanda kondisi</p>
              <div className="flex flex-wrap gap-1.5">
                {report.conditionTags.map((t) => (
                  <Chip key={t} size="sm" variant="flat">
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          {report.classifications.length > 0 ? (
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="mb-1.5 text-xs font-medium text-stone-500">Hasil identifikasi foto (otomatis oleh sistem)</p>
              <ul className="space-y-1">
                {report.classifications.map((c, i) => (
                  <li key={i} className="text-sm text-stone-700">
                    {c.animalClassName ?? "Belum teridentifikasi"} · keyakinan {Math.round(c.confidence * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
            Demi privasi, halaman publik tidak menampilkan kontak pelapor, koordinat GPS presisi, maupun isi foto asli.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
