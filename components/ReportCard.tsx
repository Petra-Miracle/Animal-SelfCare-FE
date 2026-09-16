"use client";

import { motion } from "framer-motion";
import { CalendarDays, Camera, MapPin, PawPrint } from "lucide-react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { reportImageUrl } from "@/lib/api";
import { formatDateID } from "@/lib/utils";
import type { PublicReport } from "@/lib/types";

export default function ReportCard({
  report,
  detailHref = "/laporan",
}: {
  report: PublicReport;
  detailHref?: string;
}) {
  const topClass = report.classifications?.[0]?.animalClassName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="h-full"
    >
      <Link
        href={`${detailHref}/${report.id}`}
        className="group block h-full overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-shadow duration-300 hover:shadow-lift"
      >
        {/* Image area */}
        <div className="relative flex h-40 items-center justify-center overflow-hidden bg-subtle">
          {report.images.length > 0 ? (
            <img
              src={reportImageUrl(report.id, report.images[0].id)}
              alt={topClass ?? report.animalTypeGuess ?? "Hewan terlantar"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <PawPrint className="h-12 w-12 text-txt-muted/40" aria-hidden />
          )}

          {/* Darurat badge */}
          {report.isEmergency ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emergency px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              <span aria-hidden>⚠</span> Darurat
            </span>
          ) : null}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-base font-bold text-txt-primary font-heading">
              {topClass ?? report.animalTypeGuess ?? "Hewan"}
            </p>
            <StatusBadge status={report.status} showEmergency={false} />
          </div>

          <div className="space-y-1">
            <p className="flex items-start gap-1.5 text-sm text-txt-secondary">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="line-clamp-1">{report.locationText}</span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-txt-muted">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatDateID(report.foundAt)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
