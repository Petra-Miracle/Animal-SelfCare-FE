"use client";

/* Detail laporan versi admin: field penuh (kontak + koordinat) + aksi yang sama. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Camera, Mail, MapPin, PawPrint, Phone, User } from "lucide-react";
import { Button, Card, CardBody, Chip, Divider } from "@heroui/react";
import { apiErrorMessage, getAdminReport } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import StatusBadge from "@/components/StatusBadge";
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
      <Button as={Link} href="/admin/laporan" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
        Daftar laporan
      </Button>
      <Card>
        <CardBody className="gap-4 p-5 sm:p-6">
          <StatusBadge status={report.status} showEmergency={report.isEmergency} />
          <h1 className="flex items-start gap-2 text-lg font-bold text-stone-900">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-700" aria-hidden /> {report.locationText}
          </h1>
          <p className="text-xs text-stone-500">
            {report.regionCity}
            {report.locationLat != null && report.locationLng != null
              ? ` · GPS ${report.locationLat.toFixed(5)}, ${report.locationLng.toFixed(5)}`
              : " · tanpa GPS"}
          </p>
          <Divider />

          <section aria-label="Kontak pelapor" className="rounded-xl bg-amber-50 p-3.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-800">Kontak pelapor (rahasia)</p>
            <ul className="space-y-1.5 text-sm text-stone-800">
              <li className="flex items-center gap-2"><User className="h-4 w-4 text-stone-400" aria-hidden /> {report.reporterName}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-stone-400" aria-hidden /> {report.reporterPhone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-stone-400" aria-hidden /> {report.reporterEmail}</li>
            </ul>
          </section>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <PawPrint className="mt-0.5 h-4 w-4 text-stone-400" aria-hidden />
              <div><dt className="text-xs text-stone-500">Jenis (tebakan)</dt><dd className="font-medium">{report.animalTypeGuess ?? "-"}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-stone-400" aria-hidden />
              <div><dt className="text-xs text-stone-500">Ditemukan</dt><dd className="font-medium">{formatDateID(report.foundAt)}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <Camera className="mt-0.5 h-4 w-4 text-stone-400" aria-hidden />
              <div><dt className="text-xs text-stone-500">Foto</dt><dd className="font-medium">{report.images.length} file</dd></div>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Jumlah</dt>
              <dd className="font-medium">{report.animalCount} ekor</dd>
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
            <p className="rounded-xl bg-stone-50 p-3 text-sm leading-relaxed text-stone-700">{report.notes}</p>
          ) : null}
          {report.classifications.length > 0 ? (
            <ul className="space-y-1 text-sm text-stone-600">
              {report.classifications.map((c) => (
                <li key={c.id}>
                  Identifikasi: {c.animalClassName ?? "-"} ({Math.round(c.confidence * 100)}%)
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-stone-400">
            Dibuat {formatDateID(report.createdAt)} · Diperbarui {formatDateID(report.updatedAt)}
            {report.claimExpiresAt ? ` · Batas klaim ${formatDateID(report.claimExpiresAt)}` : ""}
          </p>
          <p className="text-xs text-stone-500">
            Untuk verifikasi / penawaran / penutupan, gunakan tombol aksi di{" "}
            <Link href="/admin/laporan" className="font-medium text-emerald-700 underline">daftar laporan</Link>.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
