import type { ReactNode } from "react";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";

export interface Crumb {
  href?: string;
  label: string;
}

/* Kepala halaman yang konsisten, opsional dengan Breadcrumbs HeroUI. */
export default function PageHeader({
  title,
  description,
  actions,
  crumbs,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  crumbs?: Crumb[];
}) {
  return (
    <div className="mb-5">
      {crumbs && crumbs.length > 0 ? (
        <Breadcrumbs size="sm" className="mb-2" aria-label="Navigasi halaman">
          {crumbs.map((c) =>
            c.href ? (
              <BreadcrumbItem key={c.label} href={c.href}>
                {c.label}
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem key={c.label}>{c.label}</BreadcrumbItem>
            )
          )}
        </Breadcrumbs>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
