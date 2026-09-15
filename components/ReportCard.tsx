"use client";

import { motion } from "framer-motion";
import { CalendarDays, Camera, MapPin, PawPrint } from "lucide-react";
import { Card, CardBody, CardFooter } from "@heroui/react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDateID } from "@/lib/utils";
import type { PublicReport } from "@/lib/types";

/* Kartu ringkas laporan publik. Catatan privasi: API publik tidak memberi
   foto asli / kontak / koordinat — jadi visual memakai placeholder. */
export default function ReportCard({ report, hrefPrefix = "/laporan" }: { report: PublicReport; hrefPrefix?: string }) {
  const topClass = report.classifications?.[0]?.animalClassName;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <Card as={Link} href={`${hrefPrefix}/${report.id}`} isPressable className="h-full w-full text-left">
        <CardBody className="gap-3 p-4">
          <div className="flex h-28 items-center justify-center gap-2 rounded-lg bg-emerald-50 text-emerald-700" aria-hidden>
            {report.images.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <Camera className="h-5 w-5" /> {report.images.length} foto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <PawPrint className="h-6 w-6" /> Tanpa foto
              </span>
            )}
          </div>
          <StatusBadge status={report.status} showEmergency={report.isEmergency} />
          <div className="space-y-1.5">
            <p className="flex items-start gap-1.5 text-sm font-semibold leading-snug text-stone-900">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
              {report.locationText}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Ditemukan {formatDateID(report.foundAt)}
            </p>
          </div>
        </CardBody>
        <CardFooter className="flex flex-wrap items-center gap-1.5 border-t border-stone-100 px-4 py-2.5 text-xs text-stone-600">
          <span className="font-medium">{topClass ?? report.animalTypeGuess ?? "Jenis belum diketahui"}</span>
          {report.conditionTags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5">
              {t}
            </span>
          ))}
          {report.animalCount > 1 ? <span>· {report.animalCount} ekor</span> : null}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
