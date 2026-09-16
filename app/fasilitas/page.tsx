"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, HandHelping, LoaderCircle, MapPin, PawPrint } from "lucide-react";
import { Button } from "@heroui/react";
import { ApiError } from "@/lib/types";
import { apiErrorMessage, claimReport, listFacilityReports, reportImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import PaginationBar from "@/components/PaginationBar";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorState, CardSkeletonGrid } from "@/components/States";
import { formatDateID, timeAgoID } from "@/lib/utils";
import type { AdminReport } from "@/lib/types";

const PAGE_SIZE = 12;

export default function FacilityReportsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await listFacilityReports(page, PAGE_SIZE, token ?? undefined);
        setItems(res.items);
        setTotal(res.total);
      } catch (e) {
        if (!silent) setError(apiErrorMessage(e, "Gagal memuat laporan."));
      } finally {
        setLoading(false);
      }
    },
    [page, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  useRealtime((ev) => {
    if (!ev.name.startsWith("report:")) return;
    if (ev.name === "report:claimed") {
      const rid = eventReportId(ev.data);
      if (rid && items.some((r) => r.id === rid)) {
        toast.info("Laporan ini baru saja diambil fasilitas lain — daftar diperbarui.");
      }
    }
    load(true);
  });

  const claim = async (r: AdminReport) => {
    setClaimingId(r.id);
    try {
      await claimReport(r.id, token ?? undefined);
      toast.success("Penanganan berhasil diambil. Segera konfirmasi sebelum 20 menit habis.");
      load(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("Laporan ini baru saja diambil fasilitas lain.");
        load(true);
      } else if (e instanceof ApiError && e.status === 403) {
        toast.error("Laporan ini tidak ditawarkan kepada fasilitas Anda.");
        load(true);
      } else {
        toast.error(apiErrorMessage(e, "Gagal mengambil penanganan."));
      }
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-txt-secondary">
          Laporan berikut ditawarkan ke RS Hewan Kupang. Ambil penanganan sebelum diambil fasilitas lain.
        </p>
      </div>

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada laporan untuk fasilitas Anda"
          hint="Laporan yang ditawarkan SuperAdmin akan muncul di sini beserta notifikasinya."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                {/* Image area */}
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-subtle">
                  {r.images.length > 0 ? (
                    <img
                      src={reportImageUrl(r.id, r.images[0].id)}
                      alt={r.animalTypeGuess ?? "Hewan"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PawPrint className="h-12 w-12 text-txt-muted/40" aria-hidden />
                  )}
                  {r.isEmergency && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emergency px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      <span aria-hidden>⚠</span> Darurat
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-bold text-txt-primary font-heading">
                      {r.animalTypeGuess ?? "Hewan"}
                    </p>
                    <StatusBadge status={r.status} showEmergency={false} />
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="flex items-start gap-1.5 text-sm text-txt-secondary">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span className="line-clamp-1">{r.locationText}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-txt-muted">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {timeAgoID(r.createdAt)}
                    </p>
                  </div>

                  {/* Claim button */}
                  {r.status === "DITAWARKAN" && (
                    <Button
                      className="w-full bg-primary font-bold text-white"
                      startContent={<HandHelping className="h-4 w-4" aria-hidden />}
                      isLoading={claimingId === r.id}
                      spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
                      onPress={() => claim(r)}
                    >
                      {claimingId === r.id ? "Mengambil…" : "Ambil Penanganan"}
                    </Button>
                  )}
                  {r.status === "DIAMBIL" && (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-subtle px-4 py-3 text-sm font-medium text-txt-secondary">
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                      Memproses...
                    </div>
                  )}
                  {r.status === "DALAM_PENANGANAN" && (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emergency-bg px-4 py-3 text-sm font-medium text-emergency">
                      <AlertCircle className="h-4 w-4" aria-hidden />
                      Laporan ini baru saja diambil fasilitas lain.
                    </div>
                  )}
                  {!["DITAWARKAN", "DIAMBIL", "DALAM_PENANGANAN"].includes(r.status) && (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-subtle px-4 py-3 text-sm font-medium text-txt-muted">
                      Sudah Diambil
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}
    </div>
  );
}
