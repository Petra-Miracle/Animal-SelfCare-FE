"use client";

import { Pagination } from "@heroui/react";

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
      <Pagination
        total={totalPages}
        page={page}
        onChange={onChange}
        showControls
        color="primary"
        aria-label="Navigasi halaman"
        classNames={{
          item: "text-txt-secondary",
          cursor: "bg-primary text-white",
        }}
      />
      <p className="text-xs text-txt-muted">
        Halaman {page} dari {totalPages} · {total} data
      </p>
    </div>
  );
}
