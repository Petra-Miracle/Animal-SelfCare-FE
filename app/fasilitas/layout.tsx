"use client";

import { BookOpenText, ClipboardCheck, House } from "lucide-react";
import { RequireAuth } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

const NAV = [
  { href: "/fasilitas", label: "Laporan Masuk", icon: ClipboardCheck },
  { href: "/fasilitas/panduan", label: "Panduan Saya", icon: BookOpenText },
  { href: "/", label: "Situs Publik", icon: House },
];

export default function FacilityLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["ADMIN_RS"]}>
      <DashboardShell title="Dashboard Fasilitas" items={NAV}>
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
