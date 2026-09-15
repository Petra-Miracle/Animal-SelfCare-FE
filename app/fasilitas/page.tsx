"use client";

/* Daftar laporan yang ditawarkan / ditangani fasilitas ini + tombol klaim.
   Anti-bentrok: 409 -> "baru saja diambil fasilitas lain" + refresh,
   403 -> tidak ditawarkan, tombol tidak stuck loading. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, HandHelping } from "lucide-react";
import { Alert, Button, Card, CardBody, CardFooter, Chip, Tooltip, User as HeroUser, useDisclosure } from "@heroui/react";
import { ApiError } from "@/lib/types";
import { apiErrorMessage, claimReport, listFacilityReports } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import PaginationBar from "@/components/PaginationBar";
import StatusBadge from "@/components/StatusBadge";
import ReportQuickView from "@/components/ReportQuickView";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/States";
import { formatDateID } from "@/lib/utils";
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
  const [preview, setPreview] = useState<AdminReport | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

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
        // Kalah race dengan fasilitas lain — pesan jelas + refresh, bukan error generik.
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
    <div>
      <PageHeader
        title="Laporan Masuk"
        description="Laporan yang ditawarkan ke fasilitas Anda & yang sedang Anda tangani."
      />
      <Alert
        color="primary"
        variant="faded"
        title="Klaim bersifat rebutan"
        description="Hanya satu fasilitas yang menang per laporan. Klaim yang menang wajib dikonfirmasi (Mulai Penanganan) dalam 20 menit."
        className="mb-4"
      />
      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada laporan untuk fasilitas Anda"
          hint="Laporan yang ditawarkan SuperAdmin akan muncul di sini beserta notifikasinya."
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((r) => (
              <Card key={r.id} className="border border-stone-200/70 shadow-card transition-shadow hover:shadow-lift">
                <CardBody className="gap-2.5 p-4 sm:p-5">
                  <StatusBadge status={r.status} showEmergency={r.isEmergency} />
                  <p className="text-sm font-extrabold leading-snug text-stone-900">{r.locationText}</p>
                  <p className="text-xs text-stone-500">
                    {r.animalTypeGuess ?? "Jenis?"} · {r.animalCount} ekor · Ditemukan {formatDateID(r.foundAt)}
                  </p>
                  {r.conditionTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.conditionTags.slice(0, 4).map((t) => (
                        <Chip key={t} size="sm" variant="flat">{t}</Chip>
                      ))}
                    </div>
                  ) : null}
                  <HeroUser
                    name={r.reporterName}
                    description={r.reporterPhone}
                    avatarProps={{ name: r.reporterName.charAt(0).toUpperCase(), size: "sm", className: "bg-stone-200 text-stone-600" }}
                  />
                </CardBody>
                <CardFooter className="gap-2 border-t border-stone-100 bg-stone-50/60 px-4 py-3">
                  <Tooltip content="Lihat detail & kelola klaim" placement="top" size="sm">
                    <Button as={Link} href={`/fasilitas/laporan/${r.id}`} size="sm" variant="bordered" startContent={<Eye className="h-3.5 w-3.5" aria-hidden />}>
                      Detail
                    </Button>
                  </Tooltip>
                  <Button size="sm" variant="light" onPress={() => { setPreview(r); onOpen(); }}>
                    Pratinjau
                  </Button>
                  {r.status === "DITAWARKAN" ? (
                    <Tooltip content="Hanya satu fasilitas yang bisa menang" placement="top" size="sm">
                      <Button
                        size="sm"
                        color="success"
                        className="ml-auto bg-brand-600 font-bold"
                        startContent={<HandHelping className="h-4 w-4" aria-hidden />}
                        isLoading={claimingId === r.id}
                        onPress={() => claim(r)}
                      >
                        {claimingId === r.id ? "Mengambil…" : "Ambil Penanganan"}
                      </Button>
                    </Tooltip>
                  ) : null}
                </CardFooter>
              </Card>
            ))}
          </div>
          <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}
      <ReportQuickView report={preview} isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} detailHref="/fasilitas/laporan" />
    </div>
  );
}
