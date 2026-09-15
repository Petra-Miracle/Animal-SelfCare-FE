import type { ReportStatus } from "./types";

/** Meta tampilan untuk setiap status laporan — satu-satunya sumber kebenaran warna/label. */
export const STATUS_META: Record<ReportStatus, { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger" }> = {
  BARU: { label: "Baru", color: "primary" },
  DIVERIFIKASI: { label: "Diverifikasi", color: "secondary" },
  DITAWARKAN: { label: "Ditawarkan", color: "warning" },
  DIAMBIL: { label: "Diambil", color: "warning" },
  DALAM_PENANGANAN: { label: "Dalam Penanganan", color: "primary" },
  SELESAI: { label: "Selesai", color: "success" },
  DITOLAK: { label: "Ditolak", color: "danger" },
  KADALUARSA: { label: "Kedaluwarsa", color: "default" },
  DIBATALKAN: { label: "Dibatalkan", color: "default" },
};

export const ALL_STATUSES = Object.keys(STATUS_META) as ReportStatus[];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** "15 Sep 2026, 14.30" dalam WIB. */
export function formatDateID(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

/** "5 mnt lalu" dst. */
export function timeAgoID(iso: string | null | undefined): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const diff = Date.now() - t;
  if (diff < 0) return "baru saja";
  const mnt = Math.floor(diff / 60000);
  if (mnt < 1) return "baru saja";
  if (mnt < 60) return `${mnt} mnt lalu`;
  const jam = Math.floor(mnt / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bln lalu`;
  return `${Math.floor(bulan / 12)} thn lalu`;
}

/** 9000000 -> "2 jam 30 mnt". null -> "-". */
export function msToHumanID(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "-";
  const totalMnt = Math.round(ms / 60000);
  if (totalMnt < 1) return "< 1 mnt";
  if (totalMnt < 60) return `${totalMnt} mnt`;
  const jam = Math.floor(totalMnt / 60);
  const sisa = totalMnt % 60;
  if (jam < 24) return sisa === 0 ? `${jam} jam` : `${jam} jam ${sisa} mnt`;
  const hari = Math.floor(jam / 24);
  const sisaJam = jam % 24;
  return sisaJam === 0 ? `${hari} hari` : `${hari} hari ${sisaJam} jam`;
}

/** Sisa waktu menuju tenggat: "19:42" / "Tenggat lewat". */
export function countdownText(targetIso: string | null | undefined, now: number): string {
  if (!targetIso) return "-";
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return "Tenggat lewat";
  const totalDetik = Math.floor(diff / 1000);
  const mnt = Math.floor(totalDetik / 60);
  const dtk = totalDetik % 60;
  return `${pad(mnt)}:${pad(dtk)}`;
}

export function isExpired(targetIso: string | null | undefined, now: number): boolean {
  if (!targetIso) return false;
  return new Date(targetIso).getTime() <= now;
}

/** Label ramah untuk tipe notifikasi backend. */
export function notificationLabel(type: string): string {
  const map: Record<string, string> = {
    REPORT_VERIFIED: "Laporan diverifikasi",
    REPORT_OFFERED: "Laporan baru ditawarkan",
    REPORT_CLAIM_LOST: "Laporan diambil fasilitas lain",
    REPORT_CLAIMED: "Laporan diklaim",
    REPORT_RELEASED: "Klaim dilepas",
    CLAIM_EXPIRED: "Klaim kedaluwarsa",
    REPORT_STATUS_CHANGED: "Status laporan berubah",
  };
  return map[type] ?? type.replaceAll("_", " ").toLowerCase();
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
