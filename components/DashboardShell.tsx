"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PawPrint } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export default function DashboardShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const active = (href: string) =>
    href.split("/").length <= 3 ? pathname === href : pathname.startsWith(href);

  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";
  const displayName = user?.role === "SUPERADMIN" ? "Super Admin" : user?.email ?? "User";
  const displayEmail = user?.email ?? "";

  return (
    <div className="flex min-h-screen bg-page">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-dark-mesh text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20" aria-hidden>
            <PawPrint className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-sm font-bold text-white font-heading">Animal SelfCare</p>
            <p className="text-xs text-white/60">Kota Kupang</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active(it.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active(it.href)
                      ? "bg-primary text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <it.icon className="h-5 w-5" aria-hidden />
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-white/50 truncate">{displayEmail}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* TopBar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm sm:px-6">
          <h1 className="text-lg font-bold text-txt-primary font-heading">{title}</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white lg:hidden">
              {initials}
            </span>
          </div>
        </header>

        {/* Mobile nav - horizontal scroll */}
        <nav aria-label={title} className="lg:hidden sticky top-16 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
          <ul className="flex gap-1.5 overflow-x-auto px-4 py-2">
            {items.map((it) => (
              <li key={it.href} className="shrink-0">
                <Link
                  href={it.href}
                  aria-current={active(it.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition-all",
                    active(it.href)
                      ? "bg-primary text-white"
                      : "bg-subtle text-txt-secondary hover:bg-border"
                  )}
                >
                  <it.icon className="h-3.5 w-3.5" aria-hidden /> {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
