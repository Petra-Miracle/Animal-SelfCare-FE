"use client";

/* Kerangka dashboard: navigasi samping di desktop, tab horizontal di HP. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const active = (href: string) =>
    href.split("/").length <= 3 ? pathname === href : pathname.startsWith(href);

  return (
    <div className="pt-6 sm:pt-8">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-200">{title}</p>
      <nav aria-label={title} className="sticky top-16 z-30 -mx-4 mt-3 bg-stone-50/95 px-4 py-2 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:p-0">
        <ul className="flex gap-1.5 overflow-x-auto pb-0.5 lg:hidden">
          {items.map((it) => (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active(it.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold shadow-sm transition-all",
                  active(it.href) ? "bg-brand-600 text-white shadow-card" : "bg-white text-stone-600 ring-1 ring-stone-200"
                )}
              >
                <it.icon className="h-3.5 w-3.5" aria-hidden /> {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-4 grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 rounded-3xl border border-stone-200/80 bg-white p-2.5 shadow-card">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active(it.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    active(it.href) ? "bg-brand-600 text-white shadow-card" : "text-stone-600 hover:bg-stone-100"
                  )}
                >
                  <it.icon className="h-4 w-4" aria-hidden /> {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
