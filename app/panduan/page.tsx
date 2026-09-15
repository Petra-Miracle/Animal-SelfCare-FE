"use client";

/* Daftar panduan pertolongan awal yang AKTIF + nama fasilitas penulis.
   Tampil sebagai Accordion Flowbite agar hemat ruang di HP, plus pencarian. */

import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Hospital, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionPanel, AccordionTitle } from "flowbite-react";
import { Badge, Input, Kbd, Skeleton } from "@heroui/react";
import { apiErrorMessage, listPublicGuides } from "@/lib/api";
import { EmptyState, ErrorState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { CareGuide } from "@/lib/types";

function facilityName(g: CareGuide): string {
  if (g.facility && typeof g.facility === "object" && "name" in g.facility) return g.facility.name;
  return "Fasilitas mitra";
}

export default function PanduanPage() {
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPublicGuides();
      setGuides(res.guides);
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat panduan."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.content.toLowerCase().includes(q) ||
        facilityName(g).toLowerCase().includes(q)
    );
  }, [guides, query]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pt-6 sm:pt-8">
      <div className="rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 p-6 text-white shadow-lift sm:p-8">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <BookOpenText className="h-6 w-6" aria-hidden /> Panduan Pertolongan Awal
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/85">
          Ditulis oleh rumah sakit & organisasi mitra, ditinjau admin sebelum diterbitkan. Baca sambil menunggu
          bantuan tiba — jangan membahayakan diri sendiri.
        </p>
        <div className="mt-4">
          <Badge content={guides.length} color="warning" size="lg" aria-label={`${guides.length} panduan aktif`}>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">Panduan aktif</span>
          </Badge>
        </div>
      </div>

      <Input
        placeholder="Cari panduan… (judul, isi, fasilitas)"
        value={query}
        onValueChange={setQuery}
        aria-label="Cari panduan"
        startContent={<Search className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />}
        endContent={<Kbd className="hidden sm:inline-flex">/</Kbd>}
        className="shadow-card"
      />

      {loading ? (
        <div className="space-y-2.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="rounded-2xl">
              <div className="h-16" />
            </Skeleton>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={guides.length === 0 ? "Belum ada panduan aktif" : "Tidak ada panduan yang cocok"}
          hint={guides.length === 0 ? "Panduan yang sudah ditinjau akan muncul di sini." : "Coba kata kunci lain."}
        />
      ) : (
        <Accordion>
          {filtered.map((g) => (
            <AccordionPanel key={g.id}>
              <AccordionTitle>
                <span className="text-left">
                  <span className="block font-semibold">{g.title}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-normal text-stone-500">
                    <Hospital className="h-3.5 w-3.5" aria-hidden /> {facilityName(g)}
                    {g.publishedAt ? ` · ${formatDateID(g.publishedAt)}` : ""}
                  </span>
                </span>
              </AccordionTitle>
              <AccordionContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{g.content}</p>
                {g.sourceNote ? (
                  <p className="mt-3 border-t border-stone-100 pt-2 text-xs italic text-stone-500">
                    Sumber: {g.sourceNote}
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionPanel>
          ))}
        </Accordion>
      )}
    </div>
  );
}
