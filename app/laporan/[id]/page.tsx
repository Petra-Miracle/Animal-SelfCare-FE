"use client";

/* Detail laporan publik: tanpa kontak pelapor & tanpa koordinat presisi.
   SSE: jika status laporan ini berubah, tampilkan toast + refresh otomatis. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Camera, MapPin, PawPrint, ShieldCheck, Tag } from "lucide-react";
import { Alert, Button, Card, CardBody, Chip, Divider, Link as HeroLink, Progress, Snippet, Tooltip } from "@heroui/react";
import { apiErrorMessage, getPublicReport } from "@/lib/api";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader
        title="Detail Laporan"
        crumbs={[{ href: "/", label: "Beranda" }, { href: "/laporan", label: "Laporan" }, { label: "Detail" }]}
      />

      <Card className="overflow-hidden border border-stone-200/80 shadow-card">
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-teal-600 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {report.regionCity}
            </span>
            <span className="text-xs text-white/85">
              Dilaporkan {timeAgoID(report.createdAt)} ({formatDateID(report.createdAt)})
            </span>
          </div>
          <h2 className="mt-2 flex items-start gap-2 text-lg font-extrabold leading-snug text-white sm:text-xl">
            <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden />
            {report.locationText}
          </h2>
        </div>
        <CardBody className="gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={report.status} showEmergency={report.isEmergency} />
            <Tooltip content="Salin ID laporan" placement="top" size="sm">
              <Snippet symbol="" size="sm" variant="bordered" className="max-w-full">
                {report.id}
              </Snippet>
            </Tooltip>
          </div>
          <Divider />

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              { icon: PawPrint, label: "Jenis hewan (perkiraan pelapor)", value: report.animalTypeGuess || "Belum diketahui" },
              { icon: CalendarDays, label: "Waktu penemuan", value: formatDateID(report.foundAt) },
              { icon: Tag, label: "Jumlah", value: `${report.animalCount} ekor` },
              { icon: Camera, label: "Foto terlampir", value: `${report.images.length} foto` },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-2.5 rounded-2xl bg-stone-50 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm" aria-hidden>
                  <row.icon className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-xs text-stone-500">{row.label}</dt>
                  <dd className="font-bold text-stone-900">{row.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {report.conditionTags.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-bold text-stone-500">Tanda kondisi</p>
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
            <div className="space-y-2.5 rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-bold text-stone-600">Hasil identifikasi foto (otomatis oleh sistem)</p>
              {report.classifications.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-stone-800">{c.animalClassName ?? "Belum teridentifikasi"}</span>
                    <span className="tabular-nums text-stone-500">{Math.round(c.confidence * 100)}%</span>
                  </div>
                  <Progress value={Math.round(c.confidence * 100)} color="success" size="sm" aria-label="Tingkat keyakinan identifikasi" />
                </div>
              ))}
            </div>
          ) : null}

          <Alert
            color="success"
            variant="faded"
            title="Privasi terjaga"
            description="Halaman publik tidak menampilkan kontak pelapor, koordinat GPS presisi, maupun isi foto asli."
            startContent={<ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />}
          />

          <p className="text-sm text-stone-500">
            Menemukan hewan lain?{" "}
            <HeroLink as={Link} href="/lapor" color="success" className="font-semibold">
              Buat laporan baru
            </HeroLink>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
