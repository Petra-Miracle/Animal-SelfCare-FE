"use client";

/* Daftar panduan pertolongan awal yang AKTIF + nama fasilitas penulis.
   Tampil sebagai Accordion Flowbite agar hemat ruang di HP. */

import { useEffect, useState } from "react";
import { BookOpenText, Hospital } from "lucide-react";
import { Accordion, AccordionContent, AccordionPanel, AccordionTitle } from "flowbite-react";
import { apiErrorMessage, listPublicGuides } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
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

  return (
    <div className="mx-auto max-w-3xl space-y-5 pt-6 sm:pt-8">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-stone-900 sm:text-2xl">
          <BookOpenText className="h-6 w-6 text-emerald-700" aria-hidden /> Panduan Pertolongan Awal
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Ditulis oleh rumah sakit & organisasi mitra, ditinjau admin sebelum diterbitkan. Baca sambil menunggu bantuan
          tiba — jangan membahayakan diri sendiri.
        </p>
      </div>

      {loading ? (
        <LoadingState label="Memuat panduan…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : guides.length === 0 ? (
        <EmptyState title="Belum ada panduan aktif" hint="Panduan yang sudah ditinjau akan muncul di sini." />
      ) : (
        <Accordion>
          {guides.map((g) => (
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
