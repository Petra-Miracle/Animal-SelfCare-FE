import { Tooltip } from "@heroui/react";
import { Siren } from "lucide-react";
import { STATUS_DESC, STATUS_META } from "@/lib/utils";
import type { ReportStatus } from "@/lib/types";

const STATUS_STYLES: Record<ReportStatus, string> = {
  BARU: "bg-primary-light text-primary",
  DIVERIFIKASI: "bg-primary-light text-primary",
  DITAWARKAN: "bg-warning-bg text-warning",
  DIAMBIL: "bg-warning-bg text-warning",
  DALAM_PENANGANAN: "bg-primary-light text-primary",
  SELESAI: "bg-success-bg text-success",
  DITOLAK: "bg-emergency-bg text-emergency",
  KADALUARSA: "bg-subtle text-txt-muted",
  DIBATALKAN: "bg-subtle text-txt-muted",
};

export default function StatusBadge({ status, showEmergency }: { status: ReportStatus; showEmergency?: boolean }) {
  const meta = STATUS_META[status] ?? { label: status };
  const style = STATUS_STYLES[status] ?? "bg-subtle text-txt-muted";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Tooltip content={STATUS_DESC[status] ?? status} placement="top" showArrow size="sm">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide cursor-help ${style}`}>
          {meta.label}
        </span>
      </Tooltip>
      {showEmergency ? (
        <Tooltip content="Ditandai darurat oleh pelapor — butuh penanganan segera." placement="top" showArrow size="sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-emergency px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white cursor-help">
            <Siren className="h-3.5 w-3.5" aria-hidden />
            Darurat
          </span>
        </Tooltip>
      ) : null}
    </span>
  );
}
