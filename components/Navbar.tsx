"use client";

/* Navigasi utama. HeroUI Navbar untuk interaksi; tautan dashboard
   hanya tampil sesuai role yang sedang login (SUPERADMIN / ADMIN_RS). */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import { useAuth } from "@/lib/auth";
import NotificationBell from "./NotificationBell";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/laporan", label: "Laporan" },
  { href: "/panduan", label: "Panduan" },
];

export default function SiteNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref = user?.role === "SUPERADMIN" ? "/admin" : user ? "/fasilitas" : null;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <Navbar isBordered maxWidth="xl" isMenuOpen={menuOpen} onMenuOpenChange={setMenuOpen} className="bg-white/90">
      <NavbarContent justify="start">
        <NavbarMenuToggle aria-label={menuOpen ? "Tutup menu" : "Buka menu"} className="sm:hidden" />
        <NavbarBrand as={Link} href="/" className="gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white" aria-hidden>
            <PawPrint className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold leading-tight text-stone-900 sm:text-base">
            Animal
            <br className="hidden" />
            <span className="text-emerald-700"> SelfCare</span>
          </span>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="center" className="hidden gap-1 sm:flex">
        {PUBLIC_LINKS.map((l) => (
          <NavbarItem key={l.href} isActive={isActive(l.href)}>
            <Link
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                isActive(l.href) ? "bg-emerald-50 text-emerald-800" : "text-stone-600 hover:bg-stone-100"
              )}
            >
              {l.label}
            </Link>
          </NavbarItem>
        ))}
        {dashboardHref ? (
          <NavbarItem isActive={pathname.startsWith(dashboardHref)}>
            <Link
              href={dashboardHref}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                pathname.startsWith(dashboardHref) ? "bg-emerald-50 text-emerald-800" : "text-stone-600 hover:bg-stone-100"
              )}
            >
              Dashboard
            </Link>
          </NavbarItem>
        ) : null}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-1.5">
        <NavbarItem>
          <Button as={Link} href="/lapor" color="success" size="sm" className="font-semibold">
            Laporkan Hewan
          </Button>
        </NavbarItem>
        <NotificationBell />
        {loading ? null : user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button aria-label="Menu akun" className="rounded-full outline-none focus:ring-2 focus:ring-emerald-500">
                <Avatar
                  size="sm"
                  name={user.email.charAt(0).toUpperCase()}
                  className="bg-emerald-700 text-white"
                />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Menu akun" disabledKeys={["info"]}>
              <DropdownItem key="info" isReadOnly textValue={user.email} className="opacity-100">
                <span className="block max-w-52 truncate text-sm font-semibold text-stone-900">{user.email}</span>
                <span className="block text-xs text-stone-500">
                  {user.role === "SUPERADMIN" ? "SuperAdmin" : "Admin Fasilitas"}
                </span>
              </DropdownItem>
              {dashboardHref ? (
                <DropdownItem key="dash" textValue="Dashboard" onPress={() => router.push(dashboardHref)}>
                  Dashboard
                </DropdownItem>
              ) : null}
              <DropdownItem key="out" textValue="Keluar" color="danger" onPress={handleLogout}>
                Keluar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Button as={Link} href="/login" variant="flat" size="sm">
              Masuk
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarMenu>
        {PUBLIC_LINKS.map((l) => (
          <NavbarMenuItem key={l.href} isActive={isActive(l.href)}>
            <Link
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={isActive(l.href) ? "font-semibold text-emerald-700" : "text-stone-700"}
            >
              {l.label}
            </Link>
          </NavbarMenuItem>
        ))}
        {dashboardHref ? (
          <NavbarMenuItem isActive={pathname.startsWith(dashboardHref)}>
            <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="text-stone-700">
              Dashboard
            </Link>
          </NavbarMenuItem>
        ) : null}
        {!user && !loading ? (
          <NavbarMenuItem>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-stone-700">
              Masuk
            </Link>
          </NavbarMenuItem>
        ) : null}
      </NavbarMenu>
    </Navbar>
  );
}
