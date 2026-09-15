"use client";

/* Daftar laporan publik: pencarian, filter status/jenis/wilayah, sort, pagination.
   Berlangganan SSE — daftar di-refresh otomatis saat ada perubahan. */

import { useCallback, useEffect, useState } from "react";
import { Funnel, RotateCcw, Search } from "lucide-react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { apiErrorMessage, listPublicReports } from "@/lib/api";
import { useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import { ALL_STATUSES, STATUS_META } from "@/lib/utils";
import ReportCard from "@/components/ReportCard";
import PaginationBar from "@/components/PaginationBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import type { PublicReport } from "@/lib/types";

const PAGE_SIZE = 12;

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

  return (
    <div className="space-y-5 pt-6 sm:pt-8">
      <div>
        <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Daftar Laporan</h1>
        <p className="mt-1 text-sm text-stone-500">
          Versi publik — tanpa kontak pelapor & lokasi presisi. {refreshing ? "Memperbarui…" : "Diperbarui otomatis."}
        </p>
      </div>

      {/* Pencarian + filter */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="Cari lokasi atau catatan…"
              value={searchInput}
              onValueChange={setSearchInput}
              aria-label="Pencarian laporan"
              startContent={<Search className="h-4 w-4 text-stone-400" aria-hidden />}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="flex-1"
            />
            <Button color="success" onPress={applySearch} aria-label="Cari">
              <Search className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Cari</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Select
              label="Status"
              placeholder="Semua"
              selectedKeys={status ? [status] : []}
              onSelectionChange={(k) => {
                setStatus(Array.from(k)[0] as string ?? "");
                setPage(1);
              }}
              aria-label="Filter status"
              startContent={<Funnel className="h-3.5 w-3.5 text-stone-400" aria-hidden />}
            >
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="Jenis hewan"
              placeholder="cth. Anjing"
              value={animalType}
              onValueChange={(v) => {
                setAnimalType(v);
                setPage(1);
              }}
              aria-label="Filter jenis hewan"
            />
            <Input
              label="Wilayah"
              placeholder="cth. Oebobo"
              value={region}
              onValueChange={(v) => {
                setRegion(v);
                setPage(1);
              }}
              aria-label="Filter wilayah"
            />
            <Select
              label="Urutkan"
              selectedKeys={[sort]}
              onSelectionChange={(k) => {
                const v = Array.from(k)[0] as typeof sort;
                if (v) {
                  setSort(v);
                  setPage(1);
                }
              }}
              aria-label="Urutan"
            >
              <SelectItem key="urgency">Paling mendesak</SelectItem>
              <SelectItem key="newest">Terbaru</SelectItem>
              <SelectItem key="oldest">Terlama</SelectItem>
            </Select>
            <div className="flex items-end">
              <Button variant="flat" size="sm" onPress={reset} isDisabled={!hasFilter} startContent={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}>
                Atur ulang
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Memuat laporan…" />
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
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
          <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </div>
  );
}
