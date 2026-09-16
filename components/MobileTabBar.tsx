"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Home, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/lapor", label: "Lapor", icon: PlusSquare },
  { href: "/laporan", label: "Daftar", icon: FileText },
  { href: "/panduan", label: "Panduan", icon: BookOpen },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:hidden"
    >
      <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-2 shadow-lg">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-[11px] font-medium transition-colors",
                active
                  ? "bg-primary-light text-primary"
                  : "text-txt-muted hover:text-txt-secondary"
              )}
            >
              <tab.icon className="h-5 w-5" aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
