import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white" aria-hidden>
                <PawPrint className="h-5 w-5" />
              </span>
              <span className="text-base font-bold text-txt-primary font-heading">
                Animal <span className="text-primary">SelfCare</span>
              </span>
            </span>
            <p className="mt-3 text-sm leading-relaxed text-txt-secondary">
              Platform pelaporan dan penanganan hewan terlantar di Kota Kupang. Lihat hewan terlantar? Laporkan dalam
              hitungan menit — tanpa perlu akun.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-bold text-txt-primary">Layanan</h3>
              <ul className="mt-2 space-y-2">
                <li><Link href="/lapor" className="text-sm text-txt-secondary hover:text-primary">Laporkan Hewan</Link></li>
                <li><Link href="/laporan" className="text-sm text-txt-secondary hover:text-primary">Daftar Laporan</Link></li>
                <li><Link href="/panduan" className="text-sm text-txt-secondary hover:text-primary">Panduan Pertolongan</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-txt-primary">Platform</h3>
              <ul className="mt-2 space-y-2">
                <li><Link href="/" className="text-sm text-txt-secondary hover:text-primary">Beranda</Link></li>
                <li><Link href="/login" className="text-sm text-txt-secondary hover:text-primary">Masuk Admin</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-txt-primary">Wilayah</h3>
              <ul className="mt-2 space-y-2">
                <li><span className="text-sm text-txt-secondary">Kota Kupang</span></li>
                <li><span className="text-sm text-txt-secondary">NTT</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-sm text-txt-muted">© 2026 Animal SelfCare — Kota Kupang</p>
            <p className="text-xs text-txt-muted">Data kontak pelapor & lokasi presisi tidak ditampilkan ke publik.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
