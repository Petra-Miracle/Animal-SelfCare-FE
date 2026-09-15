import { Chip, Tooltip } from "@heroui/react";
import { Siren } from "lucide-react";
import { STATUS_DESC, STATUS_META } from "@/lib/utils";
import type { ReportStatus } from "@/lib/types";

/* Satu-satunya komponen badge status — dipakai di semua halaman agar konsisten.
   Tooltip menjelaskan arti tiap status. */
export default function StatusBadge({ status, showEmergency }: { status: ReportStatus; showEmergency?: boolean }) {
  const meta = STATUS_META[status] ?? { label: status, color: "default" as const };
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Tooltip content={STATUS_DESC[status] ?? status} placement="top" showArrow size="sm">
        <Chip color={meta.color} variant="flat" size="sm" className="cursor-help font-medium">
          {meta.label}
        </Chip>
      </Tooltip>
      {showEmergency ? (
        <Tooltip content="Ditandai darurat oleh pelapor — butuh penanganan segera." placement="top" showArrow size="sm">
          <Chip color="danger" variant="solid" size="sm" className="cursor-help" startContent={<Siren className="h-3.5 w-3.5" aria-hidden />}>
            Darurat
          </Chip>
        </Tooltip>
      ) : null}
    </span>
  );
}
