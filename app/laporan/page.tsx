"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpDown, RotateCcw, Search } from "lucide-react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { apiErrorMessage, listPublicReports } from "@/lib/api";
import { useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import { ALL_STATUSES, STATUS_META } from "@/lib/utils";
import ReportCard from "@/components/ReportCard";
import PaginationBar from "@/components/PaginationBar";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/States";
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
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const searchRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-txt-primary font-heading">Daftar Laporan</h1>
        <p className="mt-1 text-sm text-txt-secondary">
          {total} laporan ditemukan{refreshing ? " · Memperbarui…" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          ref={searchRef}
          placeholder="Cari laporan…"
          value={searchInput}
          onValueChange={setSearchInput}
          aria-label="Pencarian laporan"
          startContent={<Search className="h-4 w-4 shrink-0 text-txt-muted" aria-hidden />}
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch();
          }}
          classNames={{
            mainWrapper: "w-full",
            input: "text-txt-primary",
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

      {/* Sort + Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-txt-muted" aria-hidden />
          <span className="text-sm text-txt-secondary">Urutkan:</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "newest" | "oldest");
              setPage(1);
            }}
            className="text-sm font-medium text-primary bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
        {hasFilter ? (
          <Button variant="light" size="sm" onPress={reset} startContent={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}>
            Atur ulang
          </Button>
        ) : null}
      </div>

      {/* Report grid */}
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
          <div className="grid gap-4 sm:grid-cols-2">
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
