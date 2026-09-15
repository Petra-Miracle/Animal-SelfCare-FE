"use client";

/* Tinjau panduan yang diajukan (DITINJAU) + aktifkan/nonaktifkan.
   Filter status via Tabs. */

import { useCallback, useEffect, useState } from "react";
import { BookOpenText } from "lucide-react";
import { Button, Card, CardBody, Chip, Skeleton, Tab, Tabs, Tooltip } from "@heroui/react";
import { apiErrorMessage, listGuidesForReview, reviewGuide } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { CareGuide, CareGuideStatus } from "@/lib/types";

const GUIDE_COLOR: Record<CareGuideStatus, "default" | "warning" | "success"> = {
  DRAFT: "default",
  DITINJAU: "warning",
  AKTIF: "success",
  DINONAKTIFKAN: "default",
};

const TABS: Array<{ key: string; label: string; status: CareGuideStatus | "" }> = [
  { key: "DITINJAU", label: "Perlu Tinjau", status: "DITINJAU" },
  { key: "AKTIF", label: "Aktif", status: "AKTIF" },
  { key: "DINONAKTIFKAN", label: "Nonaktif", status: "DINONAKTIFKAN" },
  { key: "DRAFT", label: "Draft", status: "DRAFT" },
  { key: "SEMUA", label: "Semua", status: "" },
];

export default function AdminGuidesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("DITINJAU");
  const [items, setItems] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const status = TABS.find((t) => t.key === tab)?.status ?? "DITINJAU";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listGuidesForReview(status || undefined, token ?? undefined);
      setItems(res.guides);
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat panduan."));
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, to: "DITINJAU" | "AKTIF" | "DINONAKTIFKAN") => {
    setBusyId(id);
    try {
      await reviewGuide(id, to, token ?? undefined);
      toast.success(
        to === "AKTIF" ? "Panduan diterbitkan." : to === "DINONAKTIFKAN" ? "Panduan dinonaktifkan." : "Panduan dikembalikan ke status tinjau."
      );
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tinjau Panduan"
        description="Panduan yang diajukan menunggu keputusan. Yang AKTIF tampil di halaman publik."
      />

      <Tabs
        selectedKey={tab}
        onSelectionChange={(k) => setTab(String(k))}
        variant="solid"
        color="success"
        aria-label="Filter status panduan"
        classNames={{ tabList: "bg-white shadow-card" }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} title={t.label} />
        ))}
      </Tabs>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="rounded-3xl">
                <div className="h-40" />
              </Skeleton>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState title="Tidak ada panduan" hint="Belum ada panduan dengan status ini." />
        ) : (
          <div className="space-y-3">
            {items.map((g) => (
              <Card key={g.id} className="border border-stone-200/70 shadow-card">
                <CardBody className="gap-2.5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden>
                      <BookOpenText className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-extrabold text-stone-900 sm:text-base">{g.title}</p>
                    <Chip size="sm" color={GUIDE_COLOR[g.status]} variant="flat">{g.status}</Chip>
                  </div>
                  <p className="text-xs text-stone-500">
                    {typeof g.facility === "object" && g.facility && "name" in g.facility ? g.facility.name : "Fasilitas mitra"}
                    {g.author ? ` · penulis ${g.author.email}` : ""} · {formatDateID(g.createdAt)}
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{g.content}</p>
                  {g.sourceNote ? <p className="text-xs italic text-stone-500">Sumber: {g.sourceNote}</p> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {g.status !== "AKTIF" ? (
                      <Tooltip content="Terbitkan ke halaman publik" placement="top" size="sm">
                        <Button size="sm" color="success" className="bg-brand-600 font-semibold" isLoading={busyId === g.id} onPress={() => review(g.id, "AKTIF")}>
                          Terbitkan (Aktif)
                        </Button>
                      </Tooltip>
                    ) : null}
                    {g.status === "AKTIF" ? (
                      <Button size="sm" variant="bordered" onPress={() => review(g.id, "DINONAKTIFKAN")} isLoading={busyId === g.id}>
                        Nonaktifkan
                      </Button>
                    ) : null}
                    {g.status === "AKTIF" || g.status === "DINONAKTIFKAN" ? (
                      <Button size="sm" variant="light" onPress={() => review(g.id, "DITINJAU")} isLoading={busyId === g.id}>
                        Kembalikan ke tinjau
                      </Button>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
