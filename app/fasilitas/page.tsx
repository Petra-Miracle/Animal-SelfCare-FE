"use client";

/* Daftar laporan yang ditawarkan / ditangani fasilitas ini + tombol klaim.
   Anti-bentrok: 409 -> "baru saja diambil fasilitas lain" + refresh,
   403 -> tidak ditawarkan, tombol tidak stuck loading. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, HandHelping } from "lucide-react";
import {
  Alert,
  Button,
  Chip,
  ScrollShadow,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  User as HeroUser,
  useDisclosure,
} from "@heroui/react";
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
          <ScrollShadow orientation="horizontal" className="rounded-3xl border border-stone-200/80 bg-white shadow-card">
            <Table aria-label="Daftar laporan fasilitas" removeWrapper>
              <TableHeader>
                <TableColumn>LAPORAN</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>PELAPOR</TableColumn>
                <TableColumn>AKSI</TableColumn>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="min-w-56">
                      <p className="max-w-64 truncate text-sm font-bold text-stone-900">{r.locationText}</p>
                      <p className="text-xs text-stone-500">
                        {formatDateID(r.foundAt)} · {r.animalTypeGuess || "?"} · {r.animalCount} ekor
                        {r.isEmergency ? " · DARURAT" : ""}
                      </p>
                      {r.conditionTags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {r.conditionTags.slice(0, 3).map((t) => (
                            <Chip key={t} size="sm" variant="flat">{t}</Chip>
                          ))}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} showEmergency={r.isEmergency} />
                    </TableCell>
                    <TableCell className="min-w-48">
                      <HeroUser
                        name={r.reporterName}
                        description={r.reporterPhone || r.reporterEmail || "-"}
                        avatarProps={{ name: r.reporterName.charAt(0).toUpperCase(), size: "sm", className: "bg-brand-600 text-white" }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tooltip content="Pratinjau cepat" placement="top" size="sm">
                          <Button size="sm" variant="light" isIconOnly aria-label="Pratinjau cepat" onPress={() => { setPreview(r); onOpen(); }}>
                            <Eye className="h-4 w-4" aria-hidden />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Detail & klaim" placement="top" size="sm">
                          <Button as={Link} href={`/fasilitas/laporan/${r.id}`} size="sm" variant="light">
                            Detail
                          </Button>
                        </Tooltip>
                        {r.status === "DITAWARKAN" ? (
                          <Tooltip content="Hanya satu fasilitas yang bisa menang" placement="top" size="sm">
                            <Button
                              size="sm"
                              color="success"
                              className="bg-brand-600 font-bold"
                              startContent={<HandHelping className="h-4 w-4" aria-hidden />}
                              isLoading={claimingId === r.id}
                              onPress={() => claim(r)}
                            >
                              {claimingId === r.id ? "Mengambil…" : "Ambil"}
                            </Button>
                          </Tooltip>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollShadow>
          <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}
      <ReportQuickView report={preview} isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} detailHref="/fasilitas/laporan" />
    </div>
  );
}
