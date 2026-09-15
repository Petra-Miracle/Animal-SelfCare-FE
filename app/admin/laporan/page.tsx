"use client";

/* Daftar laporan lengkap (field penuh) + aksi SuperAdmin:
   verifikasi, tolak (+alasan), tawarkan ke 1+ fasilitas, tutup.
   Filter cepat via Tabs, pelapor sebagai User, pratinjau via Drawer.
   Semua hasil akhir ditentukan backend — error 403/409 ditampilkan apa adanya. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search, ShieldCheck } from "lucide-react";
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
  ScrollShadow,
  Select,
  SelectItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  Tooltip,
  User as HeroUser,
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
import PageHeader from "@/components/PageHeader";
import PaginationBar from "@/components/PaginationBar";
import StatusBadge from "@/components/StatusBadge";
import ReportQuickView from "@/components/ReportQuickView";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { AdminReport, CareFacility, ReportStatus } from "@/lib/types";

const PAGE_SIZE = 15;

const QUICK_TABS: Array<{ key: string; label: string; status: ReportStatus | "" }> = [
  { key: "SEMUA", label: "Semua", status: "" },
  { key: "BARU", label: "Baru", status: "BARU" },
  { key: "DIVERIFIKASI", label: "Diverifikasi", status: "DIVERIFIKASI" },
  { key: "DITAWARKAN", label: "Ditawarkan", status: "DITAWARKAN" },
  { key: "DIAMBIL", label: "Diambil", status: "DIAMBIL" },
  { key: "DALAM_PENANGANAN", label: "Ditangani", status: "DALAM_PENANGANAN" },
  { key: "SELESAI", label: "Selesai", status: "SELESAI" },
];

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
  const [tab, setTab] = useState("SEMUA");
  const [filters, setFilters] = useState<ReportListParams>({ sort: "newest" });
  const [facilities, setFacilities] = useState<CareFacility[]>([]);
  const [preview, setPreview] = useState<AdminReport | null>(null);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: previewOpen, onOpen: onPreviewOpen, onOpenChange: onPreviewChange, onClose: onPreviewClose } = useDisclosure();
  const [action, setAction] = useState<Action>(null);
  const [reason, setReason] = useState("");
  const [closeTo, setCloseTo] = useState<"SELESAI" | "DIBATALKAN">("SELESAI");
  const [offerIds, setOfferIds] = useState<string[]>([]);

  const activeStatus = useMemo(
    () => QUICK_TABS.find((t) => t.key === tab)?.status ?? "",
    [tab]
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await listAdminReports(
          { ...filters, status: (activeStatus || undefined) as ReportStatus | undefined, page, pageSize: PAGE_SIZE },
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
    [filters, activeStatus, page, token]
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

  const openPreview = (r: AdminReport) => {
    setPreview(r);
    onPreviewOpen();
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
    <div>
      <PageHeader title="Kelola Laporan" description="Field lengkap termasuk kontak pelapor. Aksi final ditentukan backend." />

      <Tabs
        selectedKey={tab}
        onSelectionChange={(k) => {
          setTab(String(k));
          setPage(1);
        }}
        variant="solid"
        color="success"
        aria-label="Filter cepat status"
        classNames={{ tabList: "bg-white shadow-card" }}
      >
        {QUICK_TABS.map((t) => (
          <Tab key={t.key} title={t.label} />
        ))}
      </Tabs>

      <div className="mb-4 mt-3 flex flex-col gap-2.5 rounded-3xl border border-stone-200/80 bg-white p-3.5 shadow-card sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Cari lokasi / catatan…"
          value={searchInput}
          onValueChange={setSearchInput}
          aria-label="Pencarian"
          startContent={<Search className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
            }
          }}
          className="sm:max-w-56"
        />
        <Select
          aria-label="Urutan"
          className="sm:max-w-44"
          selectedKeys={[filters.sort ?? "newest"]}
          onSelectionChange={(k) => {
            const v = Array.from(k)[0] as ReportListParams["sort"];
            if (v) {
              setPage(1);
              setFilters((f) => ({ ...f, sort: v }));
            }
          }}
        >
          <SelectItem key="urgency">Mendesak</SelectItem>
          <SelectItem key="newest">Terbaru</SelectItem>
          <SelectItem key="oldest">Terlama</SelectItem>
        </Select>
        <Button
          color="success"
          className="bg-brand-600 font-semibold"
          onPress={() => {
            setPage(1);
            setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
          }}
        >
          Tampilkan
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : items.length === 0 ? (
        <EmptyState title="Tidak ada laporan" hint="Ubah filter atau tunggu laporan baru dari masyarakat." />
      ) : (
        <>
          <ScrollShadow orientation="horizontal" className="rounded-3xl border border-stone-200/80 bg-white shadow-card">
            <Table aria-label="Daftar laporan admin" removeWrapper>
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
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} showEmergency={false} />
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
                          <Button size="sm" variant="light" isIconOnly aria-label="Pratinjau cepat" onPress={() => openPreview(r)}>
                            <Eye className="h-4 w-4" aria-hidden />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Buka detail lengkap" placement="top" size="sm">
                          <Button as={Link} href={`/admin/laporan/${r.id}`} size="sm" variant="light" aria-label="Lihat detail">
                            Detail
                          </Button>
                        </Tooltip>
                        {canVerify(r.status) ? (
                          <Button size="sm" color="success" variant="flat" isLoading={busyId === r.id} onPress={() => runVerify(r)}>
                            Verifikasi
                          </Button>
                        ) : null}
                        {canReject(r.status) ? (
                          <Button size="sm" color="danger" variant="flat" onPress={() => openAction({ kind: "reject", report: r })}>
                            Tolak
                          </Button>
                        ) : null}
                        {canOffer(r.status) ? (
                          <Button size="sm" color="warning" variant="flat" startContent={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />} onPress={() => openAction({ kind: "offer", report: r })}>
                            Tawarkan
                          </Button>
                        ) : null}
                        {canClose(r.status) ? (
                          <Button size="sm" variant="bordered" onPress={() => openAction({ kind: "close", report: r })}>
                            Tutup
                          </Button>
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

      <ReportQuickView report={preview} isOpen={previewOpen} onOpenChange={onPreviewChange} onClose={onPreviewClose} detailHref="/admin/laporan" />

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                {action?.kind === "reject" ? "Tolak laporan" : action?.kind === "offer" ? "Tawarkan ke fasilitas" : "Tutup laporan"}
              </ModalHeader>
              <ModalBody className="gap-3">
                <p className="truncate text-sm text-stone-500">{action?.report.locationText}</p>
                {action?.kind === "offer" ? (
                  <div className="max-h-64 space-y-1.5 overflow-y-auto">
                    {verifiedFacilities.length === 0 ? (
                      <p className="text-sm text-stone-500">Belum ada fasilitas terverifikasi. Tambahkan di menu Fasilitas.</p>
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
                          <span className="block text-xs text-stone-500">{f.regionCity} · {f.type}</span>
                        </Checkbox>
                      ))
                    )}
                  </div>
                ) : null}
                {action?.kind === "close" ? (
                  <RadioGroup
                    label="Status penutup"
                    orientation="horizontal"
                    value={closeTo}
                    onValueChange={(v) => setCloseTo(v as typeof closeTo)}
                  >
                    <Radio value="SELESAI">SELESAI</Radio>
                    <Radio value="DIBATALKAN">DIBATALKAN</Radio>
                  </RadioGroup>
                ) : null}
                {action?.kind !== "offer" ? (
                  <Textarea
                    label={action?.kind === "reject" ? "Alasan penolakan (wajib)" : "Alasan / catatan (opsional)"}
                    value={reason}
                    onValueChange={setReason}
                    minRows={2}
                  />
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Batal
                </Button>
                <Button
                  color={action?.kind === "reject" || (action?.kind === "close" && closeTo === "DIBATALKAN") ? "danger" : "success"}
                  onPress={runModalAction}
                  isLoading={!!busyId}
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
