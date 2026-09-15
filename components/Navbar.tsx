"use client";

/* Navigasi utama situs — dibangun dengan Pro-style Navbar
   (components/pro-navbar.tsx, API setara HeroUI Pro):
   routing client-side Next.js via prop `navigate` (dokumen Pro: Option 2),
   `hideOnScroll`, dan mobile menu bawaan (MenuToggle + Menu + MenuItem).
   Tautan dashboard hanya tampil sesuai role yang sedang login. */

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
} from "@heroui/react";
import { useAuth } from "@/lib/auth";
import NotificationBell from "./NotificationBell";
import { Navbar } from "./pro-navbar";

const PUBLIC_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/laporan", label: "Laporan" },
  { href: "/panduan", label: "Panduan" },
];

export default function SiteNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const dashboardHref = user?.role === "SUPERADMIN" ? "/admin" : user ? "/fasilitas" : null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <Navbar navigate={router.push} hideOnScroll maxWidth="xl" aria-label="Navigasi utama">
      <Navbar.Header>
        <Navbar.MenuToggle className="md:hidden" srLabel="Buka/tutup menu navigasi" />

        <Navbar.Brand>
          <Link href="/" className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Animal SelfCare — Beranda">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white" aria-hidden>
              <PawPrint className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold leading-tight text-stone-900 sm:text-base">
              Animal <span className="text-emerald-700">SelfCare</span>
            </span>
          </Link>
        </Navbar.Brand>

        {/* Navigasi desktop */}
        <Navbar.Content className="hidden md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Navbar.Item key={l.href} href={l.href} isCurrent={isActive(l.href)}>
              {l.label}
            </Navbar.Item>
          ))}
          {dashboardHref ? (
            <Navbar.Item href={dashboardHref} isCurrent={pathname.startsWith(dashboardHref)}>
              Dashboard
            </Navbar.Item>
          ) : null}
        </Navbar.Content>

        <Navbar.Spacer />

        <Navbar.Content>
          <Button as={Link} href="/lapor" color="success" size="sm" className="font-semibold">
            Laporkan Hewan
          </Button>
          <NotificationBell />
          {loading ? null : user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button aria-label="Menu akun" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
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
            <Button as={Link} href="/login" variant="flat" size="sm">
              Masuk
            </Button>
          )}
        </Navbar.Content>

        {/* Menu mobile bawaan Pro Navbar (otomatis menutup setelah dipilih). */}
        <Navbar.Menu>
          {PUBLIC_LINKS.map((l) => (
            <Navbar.MenuItem key={l.href} href={l.href} isCurrent={isActive(l.href)}>
              {l.label}
            </Navbar.MenuItem>
          ))}
          {dashboardHref ? (
            <Navbar.MenuItem href={dashboardHref} isCurrent={pathname.startsWith(dashboardHref)}>
              Dashboard
            </Navbar.MenuItem>
          ) : null}
          {!user && !loading ? <Navbar.MenuItem href="/login">Masuk</Navbar.MenuItem> : null}
          {user ? <Navbar.MenuItem onPress={handleLogout}>Keluar ({user.email})</Navbar.MenuItem> : null}
        </Navbar.Menu>
      </Navbar.Header>
    </Navbar>
  );
}
