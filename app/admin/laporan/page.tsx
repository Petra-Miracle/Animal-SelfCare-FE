"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import {
  apiErrorMessage,
  asArray,
  closeReport,
  listAdminReports,
  listFacilities,
  offerReport,
  rejectReport,
  verifyReport,
  type ReportListParams,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import PaginationBar from "@/components/PaginationBar";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/States";
import { ALL_STATUSES, STATUS_META, timeAgoID } from "@/lib/utils";
import type { AdminReport, CareFacility, ReportStatus } from "@/lib/types";

const PAGE_SIZE = 15;

type Action = { kind: "reject" | "offer" | "close"; report: AdminReport } | null;

export default function AdminReportsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [animalType, setAnimalType] = useState("");
  const [region, setRegion] = useState("");
  const [filters, setFilters] = useState<ReportListParams>({ sort: "newest" });
  const [facilities, setFacilities] = useState<CareFacility[]>([]);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState("");
  const [closeTo, setCloseTo] = useState<"SELESAI" | "DIBATALKAN">("SELESAI");
  const [offerIds, setOfferIds] = useState<string[]>([]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await listAdminReports(
          {
            ...filters,
            status: (status || undefined) as ReportStatus | undefined,
            animalType: animalType || undefined,
            region: region || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
          token ?? undefined
        );
        setItems(res.items);
        setTotal(res.total);
      } catch (e) {
        if (!silent) setError(apiErrorMessage(e, "Gagal memuat laporan."));
      } finally {
        setLoading(false);
      }
    },
    [filters, status, animalType, region, page, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listFacilities(token ?? undefined)
      .then((res) => setFacilities(asArray<CareFacility>(res, "facilities")))
      .catch(() => setFacilities([]));
  }, [token]);

  useRealtime((ev) => {
    if (ev.name.startsWith("report:")) load(true);
  });

  const openAction = (a: NonNullable<Action>) => {
    setAction(a);
    setReason("");
    setCloseTo("SELESAI");
    setOfferIds([]);
    onOpen();
  };

  const runVerify = async (r: AdminReport) => {
    setBusyId(r.id);
    try {
      await verifyReport(r.id, undefined, token ?? undefined);
      toast.success(`Laporan di ${r.locationText} terverifikasi.`);
      load(true);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const runModalAction = async () => {
    if (!action) return;
    if (action.kind === "reject" && reason.trim().length < 3) {
      toast.error("Isi alasan penolakan (min. 3 karakter).");
      return;
    }
    if (action.kind === "offer" && offerIds.length === 0) {
      toast.error("Pilih minimal 1 fasilitas tujuan.");
      return;
    }
    setBusyId(action.report.id);
    try {
      if (action.kind === "reject") {
        await rejectReport(action.report.id, reason.trim(), token ?? undefined);
        toast.success("Laporan ditolak.");
      } else if (action.kind === "offer") {
        await offerReport(action.report.id, offerIds, token ?? undefined);
        toast.success(`Laporan ditawarkan ke ${offerIds.length} fasilitas.`);
      } else {
        await closeReport(action.report.id, closeTo, reason.trim() || undefined, token ?? undefined);
        toast.success(`Laporan ditutup (${closeTo}).`);
      }
      onClose();
      load(true);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const verifiedFacilities = useMemo(() => facilities.filter((f) => f.isVerified), [facilities]);

  const canVerify = (s: ReportStatus) => s === "BARU";
  const canReject = (s: ReportStatus) => s === "BARU" || s === "DIVERIFIKASI";
  const canOffer = (s: ReportStatus) => s === "DIVERIFIKASI";
  const canClose = (s: ReportStatus) =>
    ["BARU", "DIVERIFIKASI", "DITAWARKAN", "DIAMBIL", "DALAM_PENANGANAN"].includes(s);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Cari laporan…"
          value={searchInput}
          onValueChange={setSearchInput}
          aria-label="Pencarian"
          startContent={<Search className="h-4 w-4 shrink-0 text-txt-muted" aria-hidden />}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
            }
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          placeholder="Status"
          selectedKeys={status ? [status] : []}
          onSelectionChange={(k) => {
            setStatus((Array.from(k)[0] as string) ?? "");
            setPage(1);
          }}
          aria-label="Filter status"
          classNames={{
            trigger: "bg-surface border border-border rounded-pill",
          }}
        >
          {ALL_STATUSES.map((s) => (
            <SelectItem key={s}>
              {STATUS_META[s].label}
            </SelectItem>
          ))}
        </Select>
        <Input
          placeholder="Jenis Hewan"
          value={animalType}
          onValueChange={(v) => {
            setAnimalType(v);
            setPage(1);
          }}
          aria-label="Filter jenis hewan"
          classNames={{
            mainWrapper: "w-auto",
            input: "text-txt-primary placeholder:text-txt-muted",
          }}
        />
        <Input
          placeholder="Wilayah"
          value={region}
          onValueChange={(v) => {
            setRegion(v);
            setPage(1);
          }}
          aria-label="Filter wilayah"
          classNames={{
            mainWrapper: "w-auto",
            input: "text-txt-primary placeholder:text-txt-muted",
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : items.length === 0 ? (
        <EmptyState title="Tidak ada laporan" hint="Ubah filter atau tunggu laporan baru dari masyarakat." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-txt-muted">
                  <th className="px-4 py-3 font-medium">Hewan</th>
                  <th className="px-4 py-3 font-medium">Lokasi</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Darurat</th>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-subtle/50">
                    <td className="px-4 py-3 font-medium text-txt-primary">{r.animalTypeGuess ?? "Hewan"}</td>
                    <td className="px-4 py-3 text-txt-secondary max-w-[200px] truncate">{r.locationText}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.isEmergency ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emergency px-3 py-1 text-[11px] font-bold text-white">
                          <span aria-hidden>⚠</span> Darurat
                        </span>
                      ) : (
                        <span className="text-txt-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-txt-muted">{timeAgoID(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canVerify(r.status) && (
                          <Button size="sm" color="primary" variant="flat" isLoading={busyId === r.id} onPress={() => runVerify(r)}>
                            Verifikasi
                          </Button>
                        )}
                        {canReject(r.status) && (
                          <Button size="sm" color="danger" variant="light" onPress={() => openAction({ kind: "reject", report: r })}>
                            Tolak
                          </Button>
                        )}
                        {canOffer(r.status) && (
                          <Button size="sm" color="primary" variant="flat" onPress={() => openAction({ kind: "offer", report: r })}>
                            Tawarkan ke Fasilitas
                          </Button>
                        )}
                        {canClose(r.status) && (
                          <Button size="sm" variant="bordered" onPress={() => openAction({ kind: "close", report: r })}>
                            Tutup Laporan
                          </Button>
                        )}
                        {!canVerify(r.status) && !canReject(r.status) && !canOffer(r.status) && !canClose(r.status) && (
                          <span className="text-xs text-txt-muted">Tidak ada aksi</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}

      {/* Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                {action?.kind === "reject" ? "Tolak laporan" : action?.kind === "offer" ? "Tawarkan ke fasilitas" : "Tutup laporan"}
              </ModalHeader>
              <ModalBody className="gap-3">
                <p className="truncate text-sm text-txt-secondary">{action?.report.locationText}</p>
                {action?.kind === "offer" && (
                  <div className="max-h-64 space-y-1.5 overflow-y-auto">
                    {verifiedFacilities.length === 0 ? (
                      <p className="text-sm text-txt-secondary">Belum ada fasilitas terverifikasi. Tambahkan di menu Fasilitas.</p>
                    ) : (
                      verifiedFacilities.map((f) => (
                        <Checkbox
                          key={f.id}
                          isSelected={offerIds.includes(f.id)}
                          onValueChange={(v) =>
                            setOfferIds((prev) => (v ? [...prev, f.id] : prev.filter((x) => x !== f.id)))
                          }
                        >
                          <span className="text-sm font-medium">{f.name}</span>
                          <span className="block text-xs text-txt-secondary">{f.regionCity} · {f.type}</span>
                        </Checkbox>
                      ))
                    )}
                  </div>
                )}
                {action?.kind === "close" && (
                  <RadioGroup
                    label="Status penutup"
                    orientation="horizontal"
                    value={closeTo}
                    onValueChange={(v) => setCloseTo(v as typeof closeTo)}
                  >
                    <Radio value="SELESAI">SELESAI</Radio>
                    <Radio value="DIBATALKAN">DIBATALKAN</Radio>
                  </RadioGroup>
                )}
                {action?.kind !== "offer" && (
                  <Textarea
                    label={action?.kind === "reject" ? "Alasan penolakan (wajib)" : "Alasan / catatan (opsional)"}
                    value={reason}
                    onValueChange={setReason}
                    minRows={2}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color={action?.kind === "reject" || (action?.kind === "close" && closeTo === "DIBATALKAN") ? "danger" : "primary"}
                  onPress={runModalAction}
                  isLoading={!!busyId}
                  className={action?.kind !== "reject" && !(action?.kind === "close" && closeTo === "DIBATALKAN") ? "bg-primary text-white" : ""}
                >
                  Konfirmasi
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
