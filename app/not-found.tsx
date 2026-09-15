import Link from "next/link";
import { House, PawPrint, Search } from "lucide-react";
import { Button } from "@heroui/react";

/* Halaman 404 global — tetap di dalam layout situs (navbar + footer). */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center sm:py-24">
      <span className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-brand-600 to-teal-600 text-white shadow-lift" aria-hidden>
        <PawPrint className="h-10 w-10" />
      </span>
      <p className="text-sm font-bold uppercase tracking-widest text-brand-700">404</p>
      <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
        Halaman tidak ditemukan
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-stone-500">
        Alamat yang Anda tuju tidak ada atau sudah dipindahkan. Coba kembali ke beranda atau cari laporan yang Anda
        maksud.
      </p>
      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Button as={Link} href="/" color="success" className="bg-brand-600 font-bold" startContent={<House className="h-4 w-4" aria-hidden />}>
          Ke Beranda
        </Button>
        <Button as={Link} href="/laporan" variant="bordered" startContent={<Search className="h-4 w-4" aria-hidden />}>
          Cari Laporan
        </Button>
      </div>
    </div>
  );
}
