"use client";

/* Daftar laporan publik: pencarian (shortcut "/"), filter status/jenis/wilayah,
   sort ButtonGroup, pagination, pratinjau Drawer.
   Berlangganan SSE — daftar di-refresh otomatis saat ada perubahan. */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, Clock, Flame, RotateCcw, Search } from "lucide-react";
import { Button, ButtonGroup, Input, Kbd, Select, SelectItem, Tooltip, useDisclosure } from "@heroui/react";
import { apiErrorMessage, listPublicReports } from "@/lib/api";
import { useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import { ALL_STATUSES, STATUS_META } from "@/lib/utils";
import ReportCard from "@/components/ReportCard";
import ReportQuickView from "@/components/ReportQuickView";
import PaginationBar from "@/components/PaginationBar";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/States";
import type { PublicReport } from "@/lib/types";

const PAGE_SIZE = 12;

const SORTS = [
  { key: "urgency", label: "Mendesak", icon: Flame },
  { key: "newest", label: "Terbaru", icon: Clock },
  { key: "oldest", label: "Terlama", icon: ArrowDownWideNarrow },
] as const;

export default function LaporanListPage() {
  const toast = useToast();
  const [items, setItems] = useState<PublicReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [animalType, setAnimalType] = useState("");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState<"urgency" | "newest" | "oldest">("newest");
  const searchRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<PublicReport | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const load = useCallback(
    async (opts?: { silent?: boolean; pageOverride?: number }) => {
      if (opts?.silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await listPublicReports({
          status: (status || undefined) as never,
          animalType: animalType || undefined,
          region: region || undefined,
          search: search || undefined,
          sort,
          page: opts?.pageOverride ?? page,
          pageSize: PAGE_SIZE,
        });
        setItems(res.items);
        setTotal(res.total);
      } catch (e) {
        setError(apiErrorMessage(e, "Gagal memuat daftar laporan."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, animalType, region, search, sort, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Shortcut "/" untuk fokus ke pencarian.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useRealtime((ev) => {
    if (!ev.name.startsWith("report:")) return;
    load({ silent: true });
  });

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const reset = () => {
    setSearch("");
    setSearchInput("");
    setStatus("");
    setAnimalType("");
    setRegion("");
    setSort("newest");
    setPage(1);
  };

  const hasFilter = search || status || animalType || region || sort !== "newest";

  const openPreview = (r: PublicReport) => {
    setPreview(r);
    onOpen();
  };

  return (
    <div className="space-y-5 pt-6 sm:pt-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">Daftar Laporan</h1>
        <p className="mt-1 text-sm text-stone-500">
          Versi publik — tanpa kontak pelapor & lokasi presisi. {refreshing ? "Memperbarui…" : "Diperbarui otomatis."}
        </p>
      </div>

      {/* Pencarian + filter */}
      <div className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3">
          {/* Baris pencarian */}
          <div className="flex gap-2">
            <Input
              ref={searchRef}
              placeholder="Cari lokasi atau catatan…"
              value={searchInput}
              onValueChange={setSearchInput}
              aria-label="Pencarian laporan"
              startContent={<Search className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />}
              endContent={<Kbd className="hidden sm:inline-flex">/</Kbd>}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="flex-1"
            />
            <Button color="success" className="bg-brand-600 font-semibold" onPress={applySearch} aria-label="Cari">
              <Search className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Cari</span>
            </Button>
          </div>
          {/* Baris filter + sort */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                placeholder="Status"
                selectedKeys={status ? [status] : []}
                onSelectionChange={(k) => {
                  setStatus((Array.from(k)[0] as string) ?? "");
                  setPage(1);
                }}
                aria-label="Filter status"
              >
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s}>
                    {STATUS_META[s].label}
                  </SelectItem>
                ))}
              </Select>
              <Input
                placeholder="Jenis hewan"
                value={animalType}
                onValueChange={(v) => {
                  setAnimalType(v);
                  setPage(1);
                }}
                aria-label="Filter jenis hewan"
              />
              <Input
                placeholder="Wilayah"
                value={region}
                onValueChange={(v) => {
                  setRegion(v);
                  setPage(1);
                }}
                aria-label="Filter wilayah"
              />
            </div>
            <div className="flex items-center gap-2">
              <ButtonGroup variant="flat" color="success" size="sm" aria-label="Urutan">
                {SORTS.map((s) => (
                  <Tooltip key={s.key} content={s.label} placement="top" size="sm">
                    <Button
                      aria-pressed={sort === s.key}
                      className={sort === s.key ? "bg-brand-600 font-bold text-white" : ""}
                      onPress={() => {
                        setSort(s.key);
                        setPage(1);
                      }}
                      aria-label={`Urutkan: ${s.label}`}
                    >
                      <s.icon className="h-4 w-4" aria-hidden />
                      <span className="hidden sm:inline">{s.label}</span>
                    </Button>
                  </Tooltip>
                ))}
              </ButtonGroup>
              <Button variant="light" size="sm" onPress={reset} isDisabled={!hasFilter} startContent={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}>
                Atur ulang
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { load(); toast.info("Memuat ulang daftar…"); }} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Tidak ada laporan yang cocok"
          hint="Coba ubah kata kunci atau atur ulang filter di atas."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <ReportCard key={r.id} report={r} onQuickView={openPreview} />
            ))}
          </div>
          <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}

      <ReportQuickView report={preview} isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} />
    </div>
  );
}
