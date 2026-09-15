"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Camera, Eye, MapPin, PawPrint } from "lucide-react";
import { Button, Card, CardBody, CardFooter, Chip } from "@heroui/react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDateID } from "@/lib/utils";
import type { PublicReport } from "@/lib/types";

/* Kartu laporan publik. Catatan privasi: API publik tidak memberi foto asli /
   kontak / koordinat — visual memakai seni gradient. Tombol "Pratinjau"
   membuka Drawer ringkas tanpa pindah halaman. */
export default function ReportCard({
  report,
  detailHref = "/laporan",
  onQuickView,
}: {
  report: PublicReport;
  detailHref?: string;
  onQuickView?: (report: PublicReport) => void;
}) {
  const topClass = report.classifications?.[0]?.animalClassName;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden border border-stone-200/80 shadow-card transition-shadow duration-300 hover:shadow-lift">
        <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600">
          <div className="bg-card-dots absolute inset-0" aria-hidden />
          <PawPrint
            className="absolute -right-4 -top-4 h-28 w-28 text-white/15 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-1.5 text-white">
            {report.images.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Camera className="h-4 w-4" aria-hidden /> {report.images.length} foto terlampir
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <PawPrint className="h-4 w-4" aria-hidden /> Tanpa foto
              </span>
            )}
            <span className="text-sm font-bold drop-shadow-sm">{topClass ?? report.animalTypeGuess ?? "Jenis belum diketahui"}</span>
          </div>
          {report.isEmergency ? (
            <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              Darurat
            </span>
          ) : null}
        </div>
        <CardBody className="gap-2.5 p-4">
          <StatusBadge status={report.status} showEmergency={false} />
          <p className="flex items-start gap-1.5 text-sm font-bold leading-snug text-stone-900">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <span className="line-clamp-2">{report.locationText}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-stone-500">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Ditemukan {formatDateID(report.foundAt)}
          </p>
          {report.conditionTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {report.conditionTags.slice(0, 3).map((t) => (
                <Chip key={t} size="sm" variant="flat" className="bg-stone-100">
                  {t}
                </Chip>
              ))}
            </div>
          ) : null}
        </CardBody>
        <CardFooter className="gap-2 border-t border-stone-100 bg-stone-50/60 px-4 py-3">
          <Button
            as={Link}
            href={`${detailHref}/${report.id}`}
            size="sm"
            color="success"
            className="font-semibold"
            endContent={<ArrowUpRight className="h-4 w-4" aria-hidden />}
          >
            Detail
          </Button>
          {onQuickView ? (
            <Button size="sm" variant="light" startContent={<Eye className="h-4 w-4" aria-hidden />} onPress={() => onQuickView(report)}>
              Pratinjau
            </Button>
          ) : null}
          {report.animalCount > 1 ? (
            <span className="ml-auto text-xs font-medium text-stone-500">{report.animalCount} ekor</span>
          ) : null}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
