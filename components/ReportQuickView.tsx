"use client";

/* Drawer pratinjau cepat laporan (dipakai daftar publik & dashboard).
   Menerima PublicReport maupun AdminReport — blok kontak hanya tampil
   bila field-nya ada (tidak pernah ada di versi publik). */

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Camera, Mail, MapPin, PawPrint, Phone, User } from "lucide-react";
import {
  Button,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Progress,
  User as HeroUser,
} from "@heroui/react";
import StatusBadge from "./StatusBadge";
import { formatDateID } from "@/lib/utils";
import type { AdminReport, PublicReport } from "@/lib/types";

type AnyReport = PublicReport | AdminReport;

function hasContact(r: AnyReport): r is AdminReport {
  return "reporterName" in r && typeof (r as AdminReport).reporterName === "string";
}

export default function ReportQuickView({
  report,
  isOpen,
  onOpenChange,
  onClose,
  detailHref = "/laporan",
}: {
  report: AnyReport | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  detailHref?: string;
}) {
  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom" size="lg">
      <DrawerContent>
        <DrawerHeader className="flex-col items-start gap-2">
          <span className="mx-auto h-1 w-12 rounded-full bg-stone-200 sm:hidden" aria-hidden />
          {report ? <StatusBadge status={report.status} showEmergency={report.isEmergency} /> : null}
          <span className="flex items-start gap-2 text-base font-bold leading-snug text-stone-900">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            {report?.locationText ?? ""}
          </span>
        </DrawerHeader>
        <DrawerBody className="gap-4">
          {report ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-stone-50 p-3">
                  <dt className="flex items-center gap-1 text-xs text-stone-500"><PawPrint className="h-3.5 w-3.5" aria-hidden /> Jenis</dt>
                  <dd className="mt-0.5 font-bold text-stone-900">{report.animalTypeGuess ?? "Belum diketahui"}</dd>
                </div>
                <div className="rounded-2xl bg-stone-50 p-3">
                  <dt className="flex items-center gap-1 text-xs text-stone-500"><Camera className="h-3.5 w-3.5" aria-hidden /> Foto & jumlah</dt>
                  <dd className="mt-0.5 font-bold text-stone-900">{report.images.length} foto · {report.animalCount} ekor</dd>
                </div>
              </dl>
              <p className="flex items-center gap-1.5 text-xs text-stone-500">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Ditemukan {formatDateID(report.foundAt)} · {report.regionCity}
              </p>
              {report.conditionTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {report.conditionTags.map((t) => (
                    <Chip key={t} size="sm" variant="flat">{t}</Chip>
                  ))}
                </div>
              ) : null}
              {report.classifications.length > 0 ? (
                <div className="space-y-2 rounded-2xl bg-stone-50 p-3">
                  <p className="text-xs font-bold text-stone-600">Identifikasi foto (otomatis)</p>
                  {report.classifications.slice(0, 3).map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-stone-700">{c.animalClassName ?? "Belum teridentifikasi"}</span>
                        <span className="tabular-nums text-stone-500">{Math.round(c.confidence * 100)}%</span>
                      </div>
                      <Progress value={Math.round(c.confidence * 100)} color="success" size="sm" aria-label={`Keyakinan ${c.animalClassName ?? ""}`} />
                    </div>
                  ))}
                </div>
              ) : null}
              {hasContact(report) ? (
                <div className="rounded-2xl bg-amber-50 p-3">
                  <HeroUser
                    name={report.reporterName}
                    description={[report.reporterPhone, report.reporterEmail].filter(Boolean).join(" · ") || "-"}
                    avatarProps={{ name: report.reporterName.charAt(0).toUpperCase(), className: "bg-amber-600 text-white" }}
                  />
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-800">
                    <User className="h-3 w-3" aria-hidden /> Kontak rahasia — hanya untuk petugas.
                    <Phone className="ml-1 h-3 w-3" aria-hidden /><Mail className="h-3 w-3" aria-hidden />
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </DrawerBody>
        <DrawerFooter className="gap-2">
          <Button variant="light" onPress={onClose}>
            Tutup
          </Button>
          {report ? (
            <Button as={Link} href={`${detailHref}/${report.id}`} color="success" className="font-semibold" endContent={<ArrowUpRight className="h-4 w-4" aria-hidden />}>
              Buka detail lengkap
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
