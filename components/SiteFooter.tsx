/* Footer konsisten memakai Flowbite (pola: HeroUI = aksi/formulir,
   Flowbite = tampilan konten seperti Footer, Accordion, Timeline). */

import Link from "next/link";
import {
  Footer,
  FooterCopyright,
  FooterDivider,
  FooterLink,
  FooterLinkGroup,
  FooterTitle,
} from "flowbite-react";
import { PawPrint } from "lucide-react";

export default function SiteFooter() {
  return (
    <Footer container className="rounded-none border-t border-stone-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white" aria-hidden>
                <PawPrint className="h-5 w-5" />
              </span>
              <span className="text-base font-bold text-stone-900">
                Animal <span className="text-emerald-700">SelfCare</span>
              </span>
            </span>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Platform pelaporan dan penanganan hewan terlantar di Kota Kupang. Lihat hewan terlantar? Laporkan dalam
              hitungan menit — tanpa perlu akun.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <FooterTitle title="Layanan" />
              <FooterLinkGroup col>
                <FooterLink as={Link} href="/lapor">
                  Laporkan Hewan
                </FooterLink>
                <FooterLink as={Link} href="/laporan">
                  Daftar Laporan
                </FooterLink>
                <FooterLink as={Link} href="/panduan">
                  Panduan Pertolongan
                </FooterLink>
              </FooterLinkGroup>
            </div>
            <div>
              <FooterTitle title="Platform" />
              <FooterLinkGroup col>
                <FooterLink as={Link} href="/">
                  Beranda
                </FooterLink>
                <FooterLink as={Link} href="/login">
                  Masuk Admin
                </FooterLink>
              </FooterLinkGroup>
            </div>
            <div>
              <FooterTitle title="Wilayah" />
              <FooterLinkGroup col>
                <FooterLink href="#">Kota Kupang</FooterLink>
                <FooterLink href="#">NTT</FooterLink>
              </FooterLinkGroup>
            </div>
          </div>
        </div>
        <FooterDivider />
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <FooterCopyright href="/" by="Animal SelfCare" year={2026} />
          <p className="text-xs text-stone-400">Data kontak pelapor & lokasi presisi tidak ditampilkan ke publik.</p>
        </div>
      </div>
    </Footer>
  );
}
