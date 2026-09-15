"use client";

/* Tinjau panduan yang diajukan (DITINJAU) + aktifkan/nonaktifkan. */

import { useCallback, useEffect, useState } from "react";
import { BookOpenText } from "lucide-react";
import { Button, Card, CardBody, Chip, Select, SelectItem } from "@heroui/react";
import { apiErrorMessage, listGuidesForReview, reviewGuide } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { CareGuide, CareGuideStatus } from "@/lib/types";

const GUIDE_COLOR: Record<CareGuideStatus, "default" | "warning" | "success"> = {
  DRAFT: "default",
  DITINJAU: "warning",
  AKTIF: "success",
  DINONAKTIFKAN: "default",
};

export default function AdminGuidesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<"" | CareGuideStatus>("DITINJAU");
  const [items, setItems] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
        description="Panduan DITINJAU menunggu keputusan. Yang AKTIF tampil di halaman publik."
        actions={
          <Select
            aria-label="Filter status panduan"
            className="w-48"
            selectedKeys={[status || "SEMUA"]}
            onSelectionChange={(k) => {
              const v = Array.from(k)[0] as string;
              setStatus(v === "SEMUA" ? "" : (v as CareGuideStatus));
            }}
          >
            <SelectItem key="DITINJAU">Ditinjau</SelectItem>
            <SelectItem key="AKTIF">Aktif</SelectItem>
            <SelectItem key="DINONAKTIFKAN">Dinonaktifkan</SelectItem>
            <SelectItem key="DRAFT">Draft</SelectItem>
            <SelectItem key="SEMUA">Semua</SelectItem>
          </Select>
        }
      />

      {loading ? (
        <LoadingState label="Memuat panduan…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Tidak ada panduan" hint="Belum ada panduan dengan status ini." />
      ) : (
        <div className="space-y-3">
          {items.map((g) => (
            <Card key={g.id} className="border border-stone-100 shadow-sm">
              <CardBody className="gap-2.5 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <BookOpenText className="h-4 w-4 text-emerald-700" aria-hidden />
                  <p className="text-sm font-bold text-stone-900 sm:text-base">{g.title}</p>
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
                    <Button size="sm" color="success" isLoading={busyId === g.id} onPress={() => review(g.id, "AKTIF")}>
                      Terbitkan (Aktif)
                    </Button>
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
  );
}
