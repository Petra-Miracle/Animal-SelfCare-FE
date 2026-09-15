"use client";

import { Pagination } from "@heroui/react";

/* Pagination tunggal berbasis HeroUI — dipakai semua daftar. */
export default function PaginationBar({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Pagination total={totalPages} page={page} onChange={onChange} showControls color="success" aria-label="Navigasi halaman" />
      <p className="text-xs text-stone-500">
        Halaman {page} dari {totalPages} · {total} data
      </p>
    </div>
  );
}
