"use client";

/* Detail klaim: hitung mundur ring 20 menit (claimExpiresAt), tombol konfirmasi
   "Dalam Penanganan", tombol lepas klaim (+alasan). */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Hourglass, MapPin, Stethoscope, Undo2 } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Snippet,
  Textarea,
  Tooltip,
  User as HeroUser,
  useDisclosure,
} from "@heroui/react";
import { apiErrorMessage, listFacilityReports, releaseClaim, startHandling } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import ClaimCountdown from "@/components/ClaimCountdown";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { AdminReport } from "@/lib/types";

export default function FacilityReportDetailPage({ params }: { params: { id: string } }) {
  const { token, user } = useAuth();
  const toast = useToast();
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        // Backend tidak menyediakan GET detail per-laporan untuk fasilitas,
        // jadi ambil dari daftar fasilitas lalu cari berdasarkan id.
        const res = await listFacilityReports(1, 100, token ?? undefined);
        const found = res.items.find((r) => r.id === params.id) ?? null;
        if (!found) {
          throw new Error("Laporan tidak ditemukan di daftar fasilitas Anda (mungkin tidak ditawarkan atau sudah berpindah status).");
        }
        setReport(found);
      } catch (e) {
        if (!silent) setError(apiErrorMessage(e, "Gagal memuat detail laporan."));
      } finally {
        setLoading(false);
      }
    },
    [params.id, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  useRealtime((ev) => {
    if (!ev.name.startsWith("report:")) return;
    if (eventReportId(ev.data) === params.id) {
      if (ev.name === "report:claim_expired") toast.error("Batas 20 menit habis — klaim dikembalikan ke status ditawarkan.");
      else toast.info("Laporan ini berubah — memuat ulang.");
      load(true);
    }
  });

  const mine = !!report && !!user?.facilityId && report.assignedFacilityId === user.facilityId;
  const isClaimed = report?.status === "DIAMBIL";
  const isHandling = report?.status === "DALAM_PENANGANAN";

  const confirm = async () => {
    if (!report) return;
    setBusy(true);
    try {
      await startHandling(report.id, undefined, token ?? undefined);
      toast.success("Status menjadi Dalam Penanganan. Terima kasih!");
      load(true);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Gagal mengubah status. Klaim mungkin sudah kedaluwarsa."));
      load(true);
    } finally {
      setBusy(false);
    }
  };

  const release = async () => {
    if (!report) return;
    if (reason.trim().length < 3) {
      toast.error("Isi alasan pelepasan (min. 3 karakter).");
      return;
    }
    setBusy(true);
    try {
      await releaseClaim(report.id, reason.trim(), token ?? undefined);
      toast.success("Klaim dilepas. Laporan kembali ditawarkan.");
      onClose();
      load(true);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <div className="pt-4">
        <LoadingState label="Memuat detail laporan…" />
      </div>
    );
  if (error)
    return (
      <div className="space-y-4">
        <Button as={Link} href="/fasilitas" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          Kembali
        </Button>
        <ErrorState message={error} onRetry={() => load()} />
      </div>
    );
  if (!report)
    return (
      <div className="space-y-4">
        <Button as={Link} href="/fasilitas" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          Kembali
        </Button>
        <EmptyState title="Laporan tidak ditemukan" />
      </div>
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Detail Klaim"
        crumbs={[{ href: "/fasilitas", label: "Laporan Masuk" }, { label: "Detail" }]}
        actions={
          <Snippet symbol="" size="sm" variant="bordered">
            {report.id}
          </Snippet>
        }
      />

      {isClaimed && mine && report.claimExpiresAt ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-card">
          <Hourglass className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-48 flex-1 text-sm text-amber-900">
            <p className="font-extrabold">Konfirmasi sebelum batas waktu habis</p>
            <p className="text-xs">Tekan “Mulai Penanganan” sebelum hitungan nol, atau klaim otomatis dikembalikan.</p>
          </div>
          <ClaimCountdown expiresAt={report.claimExpiresAt} onExpire={() => load(true)} />
        </div>
      ) : null}

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
              : ""}
            {" · "}Ditemukan {formatDateID(report.foundAt)}
          </p>
        </div>
        <CardBody className="gap-4 p-5 sm:p-6">
          <section aria-label="Kontak pelapor" className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-stone-500">Kontak pelapor</p>
            <HeroUser
              name={report.reporterName}
              description={[report.reporterPhone, report.reporterEmail].filter(Boolean).join(" · ") || "-"}
              avatarProps={{ name: report.reporterName.charAt(0).toUpperCase(), className: "bg-brand-600 text-white" }}
            />
          </section>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="rounded-2xl bg-stone-50 p-3"><span className="text-xs text-stone-500">Jenis (tebakan)</span><br /><strong>{report.animalTypeGuess || "-"}</strong></p>
            <p className="rounded-2xl bg-stone-50 p-3"><span className="text-xs text-stone-500">Jumlah</span><br /><strong>{report.animalCount} ekor</strong></p>
          </div>
          {report.conditionTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {report.conditionTags.map((t) => (
                <Chip key={t} size="sm" variant="flat">{t}</Chip>
              ))}
            </div>
          ) : null}
          {report.notes ? <p className="rounded-2xl bg-stone-50 p-3.5 text-sm leading-relaxed text-stone-700">{report.notes}</p> : null}
          <Divider />

          <div className="flex flex-wrap gap-2 pt-1">
            {isClaimed && mine && !isHandling ? (
              <Tooltip content="Ubah status menjadi DALAM_PENANGANAN" placement="top" size="sm">
                <Button color="success" className="bg-brand-600 font-bold" startContent={<Stethoscope className="h-4 w-4" aria-hidden />} isLoading={busy} onPress={confirm}>
                  Mulai Penanganan
                </Button>
              </Tooltip>
            ) : null}
            {isClaimed && mine ? (
              <Button variant="bordered" color="danger" startContent={<Undo2 className="h-4 w-4" aria-hidden />} onPress={onOpen}>
                Lepas Klaim
              </Button>
            ) : null}
            {isHandling && mine ? (
              <Alert
                color="success"
                variant="faded"
                title="Dalam penanganan fasilitas Anda"
                description="Penyelesaian akhir (SELESAI) dilakukan oleh SuperAdmin."
              />
            ) : null}
            {!mine && isClaimed ? (
              <Alert color="default" variant="faded" title="Klaim dipegang fasilitas lain" />
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>Lepas klaim?</ModalHeader>
              <ModalBody className="gap-3">
                <p className="text-sm text-stone-600">Laporan kembali ke status DITAWARKAN dan bisa diambil fasilitas lain.</p>
                <Textarea label="Alasan pelepasan (wajib)" value={reason} onValueChange={setReason} minRows={2} />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Batal</Button>
                <Button color="danger" onPress={release} isLoading={busy}>Lepas Klaim</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
