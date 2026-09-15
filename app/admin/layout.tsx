"use client";

import { BookOpenText, Building, ClipboardCheck, House, ScrollText, UsersRound } from "lucide-react";
import { RequireAuth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const NAV = [
  { href: "/admin", label: "Statistik", icon: House },
  { href: "/admin/laporan", label: "Laporan", icon: ClipboardCheck },
  { href: "/admin/fasilitas", label: "Fasilitas", icon: Building },
  { href: "/admin/akun", label: "Akun", icon: UsersRound },
  { href: "/admin/panduan", label: "Panduan", icon: BookOpenText },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["SUPERADMIN"]}>
      <DashboardShell title="Dashboard SuperAdmin" items={NAV}>
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
