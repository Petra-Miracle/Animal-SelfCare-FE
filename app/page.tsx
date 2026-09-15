"use client";

/* Beranda: hero singkat, CTA lapor, cuplikan laporan terbaru (realtime),
   alur 3 langkah (Flowbite Timeline), cuplikan panduan, CTA bawah. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenText, Camera, ClipboardCheck, Hospital, PawPrint, Siren } from "lucide-react";
import { Button, Card, CardBody } from "@heroui/react";
import { Timeline, TimelineBody, TimelineContent, TimelineItem, TimelinePoint, TimelineTitle } from "flowbite-react";
import { apiErrorMessage, listPublicGuides, listPublicReports } from "@/lib/api";
import { useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import ReportCard from "@/components/ReportCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import type { CareGuide, PublicReport } from "@/lib/types";

export default function HomePage() {
  const toast = useToast();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, g] = await Promise.all([
        listPublicReports({ sort: "newest", page: 1, pageSize: 6 }),
        listPublicGuides(),
      ]);
      setReports(r.items);
      setGuides(g.guides.slice(0, 3));
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat data beranda."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: laporan baru / berubah -> segarkan cuplikan tanpa reload halaman.
  useRealtime((ev) => {
    if (ev.name.startsWith("report:")) load();
  });

  return (
    <div className="space-y-12 pt-6 sm:pt-10">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-5"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <PawPrint className="h-3.5 w-3.5" aria-hidden /> Kota Kupang · Tanpa perlu akun
          </span>
          <h1 className="text-balance text-3xl font-extrabold leading-tight text-stone-900 sm:text-4xl lg:text-5xl">
            Lihat hewan terlantar? <span className="text-emerald-700">Laporkan dalam hitungan menit.</span>
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">
            Animal SelfCare menghubungkan laporan warga dengan rumah sakit hewan dan organisasi penyelamat. Cukup foto,
            tandai lokasi, dan isi kondisi hewan — tim fasilitas yang akan menindaklanjuti.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button as={Link} href="/lapor" color="success" size="lg" className="font-semibold" startContent={<Siren className="h-5 w-5" aria-hidden />}>
              Laporkan Hewan Terlantar
            </Button>
            <Button as={Link} href="/laporan" variant="bordered" size="lg">
              Lihat Laporan <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <p className="text-xs text-stone-500">
            Privasi terjaga: nama & kontak Anda hanya terlihat oleh admin, tidak pernah tampil di halaman publik.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { icon: Camera, title: "Foto & lokasi", desc: "Ambil foto di lokasi, GPS terisi otomatis" },
            { icon: ClipboardCheck, title: "Diverifikasi admin", desc: "Setiap laporan ditinjau sebelum diteruskan" },
            { icon: Hospital, title: "Ditanani fasilitas", desc: "RS hewan & organisasi mengambil penanganan" },
            { icon: BookOpenText, title: "Panduan darurat", desc: "Pertolongan awal sambil menunggu bantuan" },
          ].map((f) => (
            <Card key={f.title} className="border border-stone-100 shadow-sm">
              <CardBody className="gap-1.5 p-4">
                <f.icon className="h-6 w-6 text-emerald-700" aria-hidden />
                <p className="text-sm font-bold text-stone-900">{f.title}</p>
                <p className="text-xs leading-relaxed text-stone-500">{f.desc}</p>
              </CardBody>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* Cuplikan laporan */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">Laporan terbaru</h2>
            <p className="text-sm text-stone-500">Diperbarui otomatis saat ada laporan atau perubahan status.</p>
          </div>
          <Button as={Link} href="/laporan" variant="light" color="success" size="sm" className="shrink-0">
            Semua <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        {loading ? (
          <LoadingState label="Memuat laporan terbaru…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => { load(); toast.info("Memuat ulang data…"); }} />
        ) : reports.length === 0 ? (
          <EmptyState title="Belum ada laporan" hint="Jadilah yang pertama melaporkan hewan terlantar di sekitar Anda." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>

      {/* Alur */}
      <section className="grid gap-6 rounded-3xl bg-emerald-900 p-6 text-emerald-50 sm:p-10 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-bold sm:text-2xl">Bagaimana laporan Anda ditangani?</h2>
          <p className="text-sm leading-relaxed text-emerald-100/90">
            Setiap laporan melewati alur yang transparan. Status bisa berubah kapan saja — halaman daftar dan detail
            diperbarui otomatis tanpa perlu me-refresh.
          </p>
          <Button as={Link} href="/panduan" className="bg-white font-semibold text-emerald-900" size="sm">
            <BookOpenText className="h-4 w-4" aria-hidden /> Baca panduan pertolongan awal
          </Button>
        </div>
        <Timeline>
          <TimelineItem>
            <TimelinePoint />
            <TimelineContent>
              <TimelineTitle className="text-emerald-50">1. Warga melapor</TimelineTitle>
              <TimelineBody className="text-emerald-100/80">Foto, lokasi, kondisi hewan, dan kontak pelapor.</TimelineBody>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelinePoint />
            <TimelineContent>
              <TimelineTitle className="text-emerald-50">2. Admin memverifikasi</TimelineTitle>
              <TimelineBody className="text-emerald-100/80">Laporan valid diteruskan ke fasilitas yang sesuai.</TimelineBody>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelinePoint />
            <TimelineContent>
              <TimelineTitle className="text-emerald-50">3. Fasilitas menangani</TimelineTitle>
              <TimelineBody className="text-emerald-100/80">Satu fasilitas mengambil penanganan lalu merawat hingga selesai.</TimelineBody>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </section>

      {/* Panduan */}
      {guides.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">Panduan pertolongan awal</h2>
            <Button as={Link} href="/panduan" variant="light" color="success" size="sm" className="shrink-0">
              Semua <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {guides.map((g) => (
              <Card key={g.id} as={Link} href="/panduan" isPressable className="border border-stone-100">
                <CardBody className="gap-2 p-4">
                  <BookOpenText className="h-5 w-5 text-emerald-700" aria-hidden />
                  <p className="text-sm font-bold leading-snug text-stone-900">{g.title}</p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-stone-500">{g.content}</p>
                  <p className="text-xs font-medium text-emerald-700">
                    {typeof g.facility === "object" && g.facility ? g.facility.name : "Fasilitas mitra"}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
