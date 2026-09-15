"use client";

/* Lapisan akses API: semua request ke backend lewat NEXT_PUBLIC_API_BASE_URL.
   Tidak ada URL backend yang di-hardcode di komponen — selalu lewat helper ini. */

import Cookies from "js-cookie";
import {
  ApiError,
  type AdminReport,
  type AnimalClass,
  type AppNotification,
  type AuditLog,
  type AuthUser,
  type CareFacility,
  type CareGuide,
  type CareGuideStatus,
  type DashboardStats,
  type ManagedUser,
  type Paginated,
  type PublicReport,
  type ReportStatus,
  type UserRole,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export const TOKEN_COOKIE = "asc_token";

export function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return Cookies.get(TOKEN_COOKIE);
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token, {
    expires: 1 / 3, // ~8 jam, mengikuti masa berlaku JWT backend
    sameSite: "lax",
    secure: typeof window !== "undefined" && window.location.protocol === "https:",
  });
}

export function clearToken(): void {
  Cookies.remove(TOKEN_COOKIE);
}

interface FetchOptions {
  method?: string;
  token?: string;
  json?: unknown;
  form?: FormData;
}

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.json !== undefined) headers["Content-Type"] = "application/json";
  const token = opts.token ?? getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.form ?? (opts.json !== undefined ? JSON.stringify(opts.json) : undefined),
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.",
    });
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiError({
      status: res.status,
      code: err?.code ?? `HTTP_${res.status}`,
      message: err?.message ?? "Terjadi kesalahan pada server.",
      details: err?.details,
    });
  }
  return data as T;
}

export function apiErrorMessage(err: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi."): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ---------- Publik ---------- */

export interface ReportListParams {
  status?: ReportStatus | "";
  animalType?: string;
  region?: string;
  search?: string;
  sort?: "urgency" | "newest" | "oldest";
  page?: number;
  pageSize?: number;
}

export function listPublicReports(params: ReportListParams) {
  return apiFetch<Paginated<PublicReport>>(
    `/reports${qs({ status: params.status || undefined, animalType: params.animalType, region: params.region, search: params.search, sort: params.sort ?? "newest", page: params.page ?? 1, pageSize: params.pageSize ?? 12 })}`
  );
}

export async function getPublicReport(id: string) {
  const res = await apiFetch<{ report: PublicReport } | PublicReport>(`/reports/${id}`);
  if (res && typeof res === "object" && "report" in res) return res as { report: PublicReport };
  return { report: res as PublicReport };
}

export async function listAnimalClasses(): Promise<AnimalClass[]> {
  const res = await apiFetch<{ animalClasses: AnimalClass[] } | AnimalClass[]>(`/animal-classes`);
  return asArray<AnimalClass>(res, "animalClasses");
}

export function listPublicGuides() {
  return apiFetch<{ guides: CareGuide[] } | CareGuide[]>(`/care-guides`).then((res) => ({
    guides: asArray<CareGuide>(res, "guides"),
  }));
}

export interface CreateReportPayload {
  photos: File[];
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  locationText: string;
  locationLat?: number;
  locationLng?: number;
  foundAt: string;
  animalTypeGuess?: string;
  conditionTags: string[];
  animalCount: number;
  notes?: string;
  isEmergency: boolean;
}

export function createReport(p: CreateReportPayload) {
  const form = new FormData();
  for (const f of p.photos) form.append("photos", f);
  form.append("reporterName", p.reporterName);
  form.append("reporterEmail", p.reporterEmail);
  form.append("reporterPhone", p.reporterPhone);
  form.append("locationText", p.locationText);
  if (p.locationLat !== undefined) form.append("locationLat", String(p.locationLat));
  if (p.locationLng !== undefined) form.append("locationLng", String(p.locationLng));
  form.append("foundAt", p.foundAt);
  if (p.animalTypeGuess) form.append("animalTypeGuess", p.animalTypeGuess);
  // Kirim conditionTags sebagai JSON string — backend menerima "string atau array string".
  // FormData.append berulang untuk key sama tidak dijamin dibaca sebagai array oleh semua parser.
  if (p.conditionTags.length > 0) form.append("conditionTags", JSON.stringify(p.conditionTags));
  form.append("animalCount", String(p.animalCount));
  if (p.notes) form.append("notes", p.notes);
  form.append("isEmergency", p.isEmergency ? "true" : "false");
  return apiFetch<{ report: PublicReport } | PublicReport>(`/reports`, { method: "POST", form }).then((res) => {
    if (res && typeof res === "object" && "report" in res) return res as { report: PublicReport };
    return { report: res as PublicReport };
  });
}

/* ---------- Auth ---------- */

export function login(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>(`/auth/login`, {
    method: "POST",
    json: { email, password },
  });
}

export function fetchMe(token?: string) {
  return apiFetch<{ user: AuthUser }>(`/auth/me`, { token });
}

/* ---------- SuperAdmin ---------- */

export function listAdminReports(params: ReportListParams, token?: string) {
  return apiFetch<Paginated<AdminReport>>(
    `/admin/reports${qs({ status: params.status || undefined, animalType: params.animalType, region: params.region, search: params.search, sort: params.sort ?? "newest", page: params.page ?? 1, pageSize: params.pageSize ?? 20 })}`,
    { token }
  );
}

export async function getAdminReport(id: string, token?: string) {
  const res = await apiFetch<{ report: AdminReport } | AdminReport>(`/admin/reports/${id}`, { token });
  if (res && typeof res === "object" && "report" in res) return res as { report: AdminReport };
  return { report: res as AdminReport };
}

export function verifyReport(id: string, isEmergency?: boolean, token?: string) {
  return apiFetch<{ report: AdminReport }>(`/admin/reports/${id}/verify`, {
    method: "PATCH",
    json: isEmergency === undefined ? {} : { isEmergency },
    token,
  });
}

export function rejectReport(id: string, reason: string, token?: string) {
  return apiFetch<{ report: AdminReport }>(`/admin/reports/${id}/reject`, {
    method: "PATCH",
    json: { reason },
    token,
  });
}

export function offerReport(id: string, facilityIds: string[], token?: string) {
  return apiFetch<{ report: AdminReport }>(`/admin/reports/${id}/offer`, {
    method: "PATCH",
    json: { facilityIds },
    token,
  });
}

export function closeReport(id: string, status: "SELESAI" | "DIBATALKAN", reason?: string, token?: string) {
  return apiFetch<{ report: AdminReport }>(`/admin/reports/${id}/status`, {
    method: "PATCH",
    json: { status, reason },
    token,
  });
}

export function listFacilities(token?: string) {
  return apiFetch<{ facilities: CareFacility[] } | CareFacility[]>(`/admin/facilities`, { token });
}

export function createFacility(
  input: { name: string; type: "HOSPITAL" | "ORGANISASI"; email: string; phone: string; address?: string; regionCity?: string; isPaidPartner?: boolean },
  token?: string
) {
  return apiFetch<{ facility: CareFacility }>(`/admin/facilities`, { method: "POST", json: input, token });
}

export function updateFacility(id: string, input: Partial<{ name: string; type: "HOSPITAL" | "ORGANISASI"; email: string; phone: string; address: string; regionCity: string; isPaidPartner: boolean; isVerified: boolean }>, token?: string) {
  return apiFetch<{ facility: CareFacility }>(`/admin/facilities/${id}`, { method: "PATCH", json: input, token });
}

export function deleteFacility(id: string, token?: string) {
  return apiFetch<void>(`/admin/facilities/${id}`, { method: "DELETE", token });
}

export function listUsers(token?: string) {
  return apiFetch<{ users: ManagedUser[] } | ManagedUser[]>(`/admin/users`, { token });
}

export function createUser(
  input: { email: string; password: string; role: UserRole; phone?: string; facilityId?: string },
  token?: string
) {
  return apiFetch<{ user: ManagedUser }>(`/admin/users`, { method: "POST", json: input, token });
}

export function deactivateUser(id: string, token?: string) {
  return apiFetch<{ user: ManagedUser }>(`/admin/users/${id}/deactivate`, { method: "PATCH", token });
}

export function listGuidesForReview(status?: CareGuideStatus | "", token?: string) {
  return apiFetch<{ guides: CareGuide[] } | CareGuide[]>(`/admin/care-guides${qs({ status: status || undefined })}`, { token }).then((res) => ({
    guides: asArray<CareGuide>(res, "guides"),
  }));
}

export function reviewGuide(id: string, status: "DITINJAU" | "AKTIF" | "DINONAKTIFKAN", token?: string) {
  return apiFetch<{ guide: CareGuide }>(`/admin/care-guides/${id}/review`, {
    method: "PATCH",
    json: { status },
    token,
  });
}

export function listAuditLogs(page: number, pageSize: number, token?: string) {
  return apiFetch<Paginated<AuditLog>>(`/admin/audit-logs${qs({ page, pageSize })}`, { token });
}

export function fetchStats(token?: string) {
  return apiFetch<DashboardStats>(`/admin/stats`, { token });
}

/* ---------- Fasilitas (ADMIN_RS) ---------- */

export function listFacilityReports(page: number, pageSize: number, token?: string) {
  return apiFetch<Paginated<AdminReport>>(`/facility/reports${qs({ page, pageSize })}`, { token });
}

/** Klaim anti-bentrok: 200 sukses, 409 sudah diambil pihak lain, 403 tidak ditawarkan. */
export function claimReport(id: string, token?: string) {
  return apiFetch<{ report: AdminReport }>(`/facility/reports/${id}/claim`, { method: "POST", token });
}

export function releaseClaim(id: string, reason: string, token?: string) {
  return apiFetch<{ report: AdminReport }>(`/facility/reports/${id}/release`, {
    method: "POST",
    json: { reason },
    token,
  });
}

/** Konfirmasi klaim (sebelum 20 menit habis) -> DALAM_PENANGANAN. */
export function startHandling(id: string, reason?: string, token?: string) {
  return apiFetch<{ report: AdminReport }>(`/facility/reports/${id}/status`, {
    method: "PATCH",
    json: { status: "DALAM_PENANGANAN", reason },
    token,
  });
}

export function listMyGuides(token?: string) {
  return apiFetch<{ guides: CareGuide[] } | CareGuide[]>(`/facility/care-guides`, { token }).then((res) => ({
    guides: asArray<CareGuide>(res, "guides"),
  }));
}

export function createGuide(input: { title: string; content: string; sourceNote?: string }, token?: string) {
  return apiFetch<{ guide: CareGuide }>(`/facility/care-guides`, { method: "POST", json: input, token });
}

export function updateGuide(id: string, input: { title?: string; content?: string; sourceNote?: string }, token?: string) {
  return apiFetch<{ guide: CareGuide }>(`/facility/care-guides/${id}`, { method: "PATCH", json: input, token });
}

export function submitGuide(id: string, token?: string) {
  return apiFetch<{ guide: CareGuide }>(`/facility/care-guides/${id}/submit`, { method: "POST", token });
}

/* ---------- Notifikasi ---------- */

export function listNotifications(page: number, pageSize: number, token?: string) {
  return apiFetch<Paginated<AppNotification>>(`/notifications${qs({ page, pageSize })}`, { token });
}

export function markNotificationRead(id: string, token?: string) {
  return apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH", token });
}

/* ---------- Normalisasi bentuk list yang berbeda-beda ---------- */

export function asArray<T>(res: { [k: string]: unknown } | T[], key: string): T[] {
  if (Array.isArray(res)) return res;
  const v = (res as Record<string, unknown>)[key];
  return Array.isArray(v) ? (v as T[]) : [];
}
