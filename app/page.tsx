"use client";

/* Beranda: hero mesh + foto, CTA lapor, cuplikan laporan terbaru (realtime +
   pratinjau Drawer), alur (Flowbite Timeline), FAQ (HeroUI Accordion),
   cuplikan panduan, CTA bawah. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  BookOpenText,
  Camera,
  ClipboardCheck,
  Hospital,
  PawPrint,
  Siren,
  Sparkles,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  Chip,
  Image,
  useDisclosure,
} from "@heroui/react";
import { Timeline, TimelineBody, TimelineContent, TimelineItem, TimelinePoint, TimelineTitle } from "flowbite-react";
import { apiErrorMessage, listPublicGuides, listPublicReports } from "@/lib/api";
import { useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import ReportCard from "@/components/ReportCard";
import ReportQuickView from "@/components/ReportQuickView";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/States";
import type { CareGuide, PublicReport } from "@/lib/types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80";

export default function HomePage() {
  const toast = useToast();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PublicReport | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

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

  const openPreview = (r: PublicReport) => {
    setPreview(r);
    onOpen();
  };

  return (
    <div className="space-y-12 pt-6 sm:pt-8">
      {/* Hero */}
      <section className="bg-hero-mesh overflow-hidden rounded-[2rem] border border-white/60 shadow-lift sm:rounded-[2.5rem]">
        <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-brand-800 shadow-sm ring-1 ring-brand-200 backdrop-blur">
              <PawPrint className="h-3.5 w-3.5" aria-hidden /> Kota Kupang · Tanpa perlu akun
            </span>
            <h1 className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-stone-900 sm:text-4xl lg:text-[3.25rem]">
              Lihat hewan terlantar?{" "}
              <span className="bg-gradient-to-r from-brand-600 to-teal-600 bg-clip-text text-transparent">
                Laporkan dalam hitungan menit.
              </span>
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-stone-600 sm:text-base">
              Animal SelfCare menghubungkan laporan warga dengan rumah sakit hewan dan organisasi penyelamat. Cukup
              foto, tandai lokasi, dan isi kondisi hewan — tim fasilitas yang akan menindaklanjuti.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button
                as={Link}
                href="/lapor"
                color="success"
                size="lg"
                className="bg-brand-600 font-bold shadow-lift"
                startContent={<Siren className="h-5 w-5" aria-hidden />}
              >
                Laporkan Hewan Terlantar
              </Button>
              <Button as={Link} href="/laporan" variant="bordered" size="lg" className="border-stone-300 bg-white/70 font-semibold backdrop-blur">
                Lihat Laporan <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { icon: BadgeCheck, label: "Diverifikasi admin" },
                { icon: BellRing, label: "Status realtime" },
                { icon: Sparkles, label: "Privasi terjaga" },
              ].map((t) => (
                <Chip key={t.label} size="sm" variant="flat" className="bg-white/80 backdrop-blur" startContent={<t.icon className="h-3.5 w-3.5" aria-hidden />}>
                  {t.label}
                </Chip>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-200 to-teal-200 shadow-lift ring-1 ring-white/60">
              <Image
                src={HERO_IMG}
                alt="Anjing yang tersenyum — hewan yang bisa Anda bantu dengan melapor"
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-2 top-6 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-lift backdrop-blur sm:-left-5"
            >
              <p className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <Camera className="h-4 w-4 text-brand-600" aria-hidden /> Foto + lokasi cukup
              </p>
              <p className="text-[11px] text-stone-500">Langsung dari HP di lokasi</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -right-2 bottom-6 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-lift backdrop-blur sm:-right-5"
            >
              <p className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <Hospital className="h-4 w-4 text-brand-600" aria-hidden /> Fasilitas siaga
              </p>
              <p className="text-[11px] text-stone-500">RS hewan & organisasi mitra</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Fitur */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Camera, tint: "bg-brand-600", title: "Foto & lokasi", desc: "Ambil foto di lokasi, GPS terisi otomatis" },
          { icon: ClipboardCheck, tint: "bg-sky-600", title: "Diverifikasi admin", desc: "Setiap laporan ditinjau sebelum diteruskan" },
          { icon: Hospital, tint: "bg-amber-600", title: "Ditangani fasilitas", desc: "RS hewan & organisasi mengambil penanganan" },
          { icon: BookOpenText, tint: "bg-violet-600", title: "Panduan darurat", desc: "Pertolongan awal sambil menunggu bantuan" },
        ].map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.06 }}>
            <Card className="h-full border border-stone-200/70 shadow-card transition-shadow hover:shadow-lift">
              <CardBody className="gap-1.5 p-4 sm:p-5">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow ${f.tint}`} aria-hidden>
                  <f.icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-extrabold text-stone-900">{f.title}</p>
                <p className="text-xs leading-relaxed text-stone-500">{f.desc}</p>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Cuplikan laporan */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">Laporan terbaru</h2>
            <p className="text-sm text-stone-500">Diperbarui otomatis saat ada laporan atau perubahan status.</p>
          </div>
          <Button as={Link} href="/laporan" variant="light" color="success" size="sm" className="shrink-0 font-semibold" endContent={<ArrowUpRight className="h-4 w-4" aria-hidden />}>
            Semua
          </Button>
        </div>
        {loading ? (
          <CardSkeletonGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={() => { load(); toast.info("Memuat ulang data…"); }} />
        ) : reports.length === 0 ? (
          <EmptyState title="Belum ada laporan" hint="Jadilah yang pertama melaporkan hewan terlantar di sekitar Anda." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} onQuickView={openPreview} />
            ))}
          </div>
        )}
      </section>

      {/* Alur */}
      <section className="bg-dark-mesh grid gap-6 rounded-[2rem] p-6 text-emerald-50 shadow-lift sm:p-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Bagaimana laporan Anda ditangani?</h2>
          <p className="text-sm leading-relaxed text-emerald-100/90">
            Setiap laporan melewati alur yang transparan. Status bisa berubah kapan saja — halaman daftar dan detail
            diperbarui otomatis tanpa perlu me-refresh.
          </p>
          <Button as={Link} href="/panduan" className="bg-white font-bold text-emerald-900" size="sm" startContent={<BookOpenText className="h-4 w-4" aria-hidden />}>
            Baca panduan pertolongan awal
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

      {/* FAQ */}
      <section className="mx-auto max-w-3xl space-y-4">
        <h2 className="text-center text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">Pertanyaan umum</h2>
        <Accordion variant="splitted" selectionMode="multiple">
          <AccordionItem key="1" title="Apakah melapor harus punya akun?">
            Tidak. Cukup isi nama, email, dan nomor HP aktif langsung di form. Kontak Anda hanya terlihat oleh admin
            dan fasilitas penangan — tidak pernah tampil di halaman publik.
          </AccordionItem>
          <AccordionItem key="2" title="Foto wajib diisi?">
            Tidak wajib, tapi sangat dianjurkan (maks 5 foto, JPEG/PNG/WebP, maks 8MB per file). Foto membantu admin
            memverifikasi dan sistem mengenali jenis hewan secara otomatis.
          </AccordionItem>
          <AccordionItem key="3" title="Bagaimana saya tahu laporan saya diproses?">
            Setiap laporan punya status (Baru → Diverifikasi → Ditawarkan → Diambil → Dalam Penanganan → Selesai).
            Halaman daftar dan detail diperbarui otomatis saat status berubah.
          </AccordionItem>
          <AccordionItem key="4" title="Hewan dalam kondisi darurat, apa yang harus saya lakukan?">
            Tandai laporan sebagai darurat, amankan diri dan hewan dari bahaya langsung (jalan raya, hewan agresif),
            lalu baca panduan pertolongan awal sambil menunggu bantuan tiba.
          </AccordionItem>
        </Accordion>
      </section>

      {/* Panduan */}
      {guides.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">Panduan pertolongan awal</h2>
            <Button as={Link} href="/panduan" variant="light" color="success" size="sm" className="shrink-0 font-semibold" endContent={<ArrowUpRight className="h-4 w-4" aria-hidden />}>
              Semua
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {guides.map((g) => (
              <Card key={g.id} as={Link} href="/panduan" isPressable className="border border-stone-200/70 shadow-card transition-shadow hover:shadow-lift">
                <CardBody className="gap-2 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden>
                    <BookOpenText className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-extrabold leading-snug text-stone-900">{g.title}</p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-stone-500">{g.content}</p>
                  <p className="text-xs font-bold text-brand-700">
                    {typeof g.facility === "object" && g.facility ? g.facility.name : "Fasilitas mitra"}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <ReportQuickView report={preview} isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} />
    </div>
  );
}
