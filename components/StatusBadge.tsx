import { Chip } from "@heroui/react";
import { Siren } from "lucide-react";
import { STATUS_META } from "@/lib/utils";
import type { ReportStatus } from "@/lib/types";

/* Satu-satunya komponen badge status — dipakai di semua halaman agar konsisten. */
export default function StatusBadge({ status, showEmergency }: { status: ReportStatus; showEmergency?: boolean }) {
  const meta = STATUS_META[status] ?? { label: status, color: "default" as const };
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Chip color={meta.color} variant="flat" size="sm" className="font-medium">
        {meta.label}
      </Chip>
      {showEmergency ? (
        <Chip color="danger" variant="solid" size="sm" startContent={<Siren className="h-3.5 w-3.5" aria-hidden />}>
          Darurat
        </Chip>
      ) : null}
    </span>
  );
}
