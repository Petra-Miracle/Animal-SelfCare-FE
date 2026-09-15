"use client";

/* Detail laporan versi admin: field penuh (kontak + koordinat) + aksi yang sama. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Camera, MapPin, PawPrint } from "lucide-react";
import { Alert, Button, Card, CardBody, Chip, Divider, Progress, Snippet, User as HeroUser } from "@heroui/react";
import { apiErrorMessage, getAdminReport } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { AdminReport } from "@/lib/types";

export default function AdminReportDetailPage({ params }: { params: { id: string } }) {
  const { token } = useAuth();
  const toast = useToast();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminReport(params.id, token ?? undefined);
      setReport(res.report);
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat detail laporan."));
    } finally {
      setLoading(false);
    }
  }, [params.id, token]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime((ev) => {
    if (!ev.name.startsWith("report:")) return;
    if (eventReportId(ev.data) === params.id) {
      toast.info("Data laporan ini berubah — memuat ulang.");
      load();
    }
  });

  if (loading)
    return (
      <div className="pt-4">
        <LoadingState label="Memuat detail laporan…" />
      </div>
    );
  if (error)
    return (
      <div className="space-y-4">
        <Button as={Link} href="/admin/laporan" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          Kembali
        </Button>
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  if (!report)
    return (
      <div className="space-y-4">
        <Button as={Link} href="/admin/laporan" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          Kembali
        </Button>
        <EmptyState title="Laporan tidak ditemukan" />
      </div>
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Detail Laporan"
        crumbs={[{ href: "/admin", label: "Dashboard" }, { href: "/admin/laporan", label: "Laporan" }, { label: "Detail" }]}
        actions={
          <Snippet symbol="" size="sm" variant="bordered">
            {report.id}
          </Snippet>
        }
      />
      <Card className="overflow-hidden border border-stone-200/80 shadow-card">
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-teal-600 px-5 py-4 sm:px-6">
          <StatusBadge status={report.status} showEmergency={report.isEmergency} />
          <h2 className="mt-2 flex items-start gap-2 text-lg font-extrabold text-white">
            <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden /> {report.locationText}
          </h2>
          <p className="mt-1 text-xs text-white/85">
            {report.regionCity}
            {report.locationLat != null && report.locationLng != null
              ? ` · GPS ${report.locationLat.toFixed(5)}, ${report.locationLng.toFixed(5)}`
              : " · tanpa GPS"}
          </p>
        </div>
        <CardBody className="gap-4 p-5 sm:p-6">
          <section aria-label="Kontak pelapor" className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-amber-800">Kontak pelapor (rahasia)</p>
            <HeroUser
              name={report.reporterName}
              description={[report.reporterPhone, report.reporterEmail].filter(Boolean).join(" · ") || "-"}
              avatarProps={{ name: report.reporterName.charAt(0).toUpperCase(), className: "bg-amber-600 text-white" }}
            />
          </section>

          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex items-start gap-2 rounded-2xl bg-stone-50 p-3">
              <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <div><dt className="text-xs text-stone-500">Jenis (tebakan)</dt><dd className="font-bold">{report.animalTypeGuess || "-"}</dd></div>
            </div>
            <div className="flex items-start gap-2 rounded-2xl bg-stone-50 p-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <div><dt className="text-xs text-stone-500">Ditemukan</dt><dd className="font-bold">{formatDateID(report.foundAt)}</dd></div>
            </div>
            <div className="flex items-start gap-2 rounded-2xl bg-stone-50 p-3">
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <div><dt className="text-xs text-stone-500">Foto · Jumlah</dt><dd className="font-bold">{report.images.length} file · {report.animalCount} ekor</dd></div>
            </div>
          </dl>

          {report.conditionTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {report.conditionTags.map((t) => (
                <Chip key={t} size="sm" variant="flat">{t}</Chip>
              ))}
            </div>
          ) : null}
          {report.notes ? (
            <p className="rounded-2xl bg-stone-50 p-3.5 text-sm leading-relaxed text-stone-700">{report.notes}</p>
          ) : null}
          {report.classifications.length > 0 ? (
            <div className="space-y-2 rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-bold text-stone-600">Identifikasi foto (otomatis)</p>
              {report.classifications.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{c.animalClassName ?? "-"}</span>
                    <span className="tabular-nums text-stone-500">{Math.round(c.confidence * 100)}%</span>
                  </div>
                  <Progress value={Math.round(c.confidence * 100)} color="success" size="sm" aria-label="Keyakinan identifikasi" />
                </div>
              ))}
            </div>
          ) : null}
          <Divider />
          <p className="text-xs text-stone-400">
            Dibuat {formatDateID(report.createdAt)} · Diperbarui {formatDateID(report.updatedAt)}
            {report.claimExpiresAt ? ` · Batas klaim ${formatDateID(report.claimExpiresAt)}` : ""}
          </p>
          <Alert
            color="primary"
            variant="faded"
            title="Kelola dari daftar"
            description="Verifikasi, penawaran, dan penutupan dilakukan lewat tombol aksi di halaman daftar laporan."
          />
        </CardBody>
      </Card>
    </div>
  );
}
