"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Camera,
  CheckCircle,
  Clock,
  FileText,
  PawPrint,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@heroui/react";
import { apiErrorMessage, listPublicGuides, listPublicReports } from "@/lib/api";
import { useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import ReportCard from "@/components/ReportCard";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/States";
import type { CareGuide, PublicReport } from "@/lib/types";

export default function HomePage() {
  const toast = useToast();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listPublicReports({ sort: "newest", page: 1, pageSize: 4 });
      setReports(r.items);
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat data beranda."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime((ev) => {
    if (ev.name.startsWith("report:")) load();
  });

  return (
    <div className="space-y-10 pb-24 md:pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-dark-mesh shadow-lift">
        <div className="relative z-10 flex flex-col items-start gap-6 p-6 sm:p-8 md:p-10 lg:w-2/3">
          <h1 className="text-balance text-3xl font-bold leading-tight text-white font-heading sm:text-4xl">
            Lihat hewan terlantar?{" "}
            <br />
            Laporkan sekarang.
          </h1>
          <p className="text-sm leading-relaxed text-white/70 sm:text-base">
            Tim rumah sakit hewan mitra siap membantu di Kota Kupang, gratis dan cepat.
          </p>
          <Button
            as={Link}
            href="/lapor"
            className="w-full bg-emergency font-bold text-white sm:w-auto"
            size="lg"
          >
            Laporkan Hewan Terlantar
          </Button>
        </div>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-mesh/90 to-transparent" aria-hidden />
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { value: "128", label: "Hewan Terbantu" },
          { value: "24", label: "Fasilitas Mitra" },
          { value: "<20mnt", label: "Rata² Respons" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-4 text-center shadow-card"
          >
            <span className="text-2xl font-bold text-primary font-heading">{stat.value}</span>
            <span className="text-xs text-txt-secondary">{stat.label}</span>
          </motion.div>
        ))}
      </section>

      {/* Cara Kerja */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-txt-primary font-heading">Cara Kerja</h2>
        <div className="space-y-3">
          {[
            {
              icon: Camera,
              title: "Foto & Laporkan",
              desc: "Ambil foto hewan dan isi lokasi kejadian.",
            },
            {
              icon: ShieldCheck,
              title: "Tim Verifikasi",
              desc: "Admin memverifikasi laporan dalam waktu singkat.",
            },
            {
              icon: Stethoscope,
              title: "Fasilitas Menangani",
              desc: "Rumah sakit mitra terdekat mengambil penanganan.",
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <step.icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-txt-primary font-heading">{step.title}</p>
                <p className="text-sm text-txt-secondary">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Laporan Terbaru */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-txt-primary font-heading">Laporan Terbaru</h2>
          <Link href="/laporan" className="text-sm font-semibold text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>
        {loading ? (
          <CardSkeletonGrid count={2} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => { load(); toast.info("Memuat ulang data…"); }} />
        ) : reports.length === 0 ? (
          <EmptyState title="Belum ada laporan" hint="Jadilah yang pertama melaporkan hewan terlantar." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
