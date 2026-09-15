"use client";

/* Detail klaim: hitung mundur 20 menit (claimExpiresAt), tombol konfirmasi
   "Dalam Penanganan", tombol lepas klaim (+alasan). */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Hourglass, Mail, MapPin, Phone, Stethoscope, Undo2, User } from "lucide-react";
import {
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
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { apiErrorMessage, listFacilityReports, releaseClaim, startHandling } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import CountdownTimer from "@/components/CountdownTimer";
import StatusBadge from "@/components/StatusBadge";
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
      <Button as={Link} href="/fasilitas" variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}>
        Laporan masuk
      </Button>

      {isClaimed && mine && report.claimExpiresAt ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <Hourglass className="h-5 w-5 text-amber-700" aria-hidden />
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-bold">Konfirmasi sebelum batas waktu habis</p>
            <p className="text-xs">Tekan “Mulai Penanganan” sebelum hitungan nol, atau klaim otomatis dikembalikan.</p>
          </div>
          <CountdownTimer expiresAt={report.claimExpiresAt} onExpire={() => load(true)} />
        </div>
      ) : null}

      <Card>
        <CardBody className="gap-4 p-5">
          <StatusBadge status={report.status} showEmergency={report.isEmergency} />
          <h1 className="flex items-start gap-2 text-lg font-bold text-stone-900">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-700" aria-hidden /> {report.locationText}
          </h1>
          <p className="text-xs text-stone-500">
            {report.regionCity}
            {report.locationLat != null && report.locationLng != null
              ? ` · GPS ${report.locationLat.toFixed(5)}, ${report.locationLng.toFixed(5)}`
              : ""}
            {" · "}Ditemukan {formatDateID(report.foundAt)}
          </p>
          <Divider />

          <section aria-label="Kontak pelapor" className="rounded-xl bg-stone-50 p-3.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Kontak pelapor</p>
            <ul className="space-y-1.5 text-sm text-stone-800">
              <li className="flex items-center gap-2"><User className="h-4 w-4 text-stone-400" aria-hidden /> {report.reporterName}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-stone-400" aria-hidden /> {report.reporterPhone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-stone-400" aria-hidden /> {report.reporterEmail}</li>
            </ul>
          </section>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-xs text-stone-500">Jenis (tebakan)</span><br /><strong>{report.animalTypeGuess ?? "-"}</strong></p>
            <p><span className="text-xs text-stone-500">Jumlah</span><br /><strong>{report.animalCount} ekor</strong></p>
          </div>
          {report.conditionTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {report.conditionTags.map((t) => (
                <Chip key={t} size="sm" variant="flat">{t}</Chip>
              ))}
            </div>
          ) : null}
          {report.notes ? <p className="rounded-xl bg-stone-50 p-3 text-sm text-stone-700">{report.notes}</p> : null}

          <div className="flex flex-wrap gap-2 pt-1">
            {isClaimed && mine && !isHandling ? (
              <Button color="success" className="font-semibold" startContent={<Stethoscope className="h-4 w-4" aria-hidden />} isLoading={busy} onPress={confirm}>
                Mulai Penanganan
              </Button>
            ) : null}
            {isClaimed && mine ? (
              <Button variant="bordered" color="danger" startContent={<Undo2 className="h-4 w-4" aria-hidden />} onPress={onOpen}>
                Lepas Klaim
              </Button>
            ) : null}
            {isHandling && mine ? (
              <p className="w-full rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                Laporan dalam penanganan fasilitas Anda. Penyelesaian akhir (SELESAI) dilakukan oleh SuperAdmin.
              </p>
            ) : null}
            {!mine && isClaimed ? (
              <p className="w-full rounded-xl bg-stone-100 px-3 py-2 text-xs text-stone-600">
                Klaim sedang dipegang fasilitas lain.
              </p>
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
