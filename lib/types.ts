/* Tipe data yang mencerminkan kontrak REST API backend Animal SelfCare.
   Jangan menambah asumsi field di luar kontrak ini. */

export type ReportStatus =
  | "BARU"
  | "DIVERIFIKASI"
  | "DITAWARKAN"
  | "DIAMBIL"
  | "DALAM_PENANGANAN"
  | "SELESAI"
  | "DITOLAK"
  | "KADALUARSA"
  | "DIBATALKAN";

export type UserRole = "SUPERADMIN" | "ADMIN_RS";

export interface ReportClassification {
  animalClassName: string | null;
  confidence: number;
}

/** Versi publik: tanpa kontak pelapor & tanpa koordinat presisi. */
export interface PublicReport {
  id: string;
  locationText: string;
  regionCity: string;
  foundAt: string;
  animalTypeGuess: string | null;
  conditionTags: string[];
  animalCount: number;
  status: ReportStatus;
  isEmergency: boolean;
  createdAt: string;
  images: { id: string }[];
  classifications: ReportClassification[];
}

export interface ReportImageMeta {
  id: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  checkStatus: string;
  createdAt: string;
}

export interface FullClassification extends ReportClassification {
  id: string;
  animalClassId: string | null;
  modelVersion: string;
  createdAt: string;
}

/** Versi lengkap (admin/fasilitas): termasuk kontak pelapor & koordinat. */
export interface AdminReport extends Omit<PublicReport, "images" | "classifications"> {
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  locationLat: number | null;
  locationLng: number | null;
  notes: string | null;
  assignedFacilityId: string | null;
  claimExpiresAt: string | null;
  updatedAt: string;
  images: ReportImageMeta[];
  classifications: FullClassification[];
  // relasi opsional yang kadang disertakan backend
  assignments?: Assignment[];
  assignedFacility?: CareFacility | null;
}

export interface Assignment {
  id: string;
  reportId: string;
  facilityId: string;
  status: "OFFERED" | "CLAIMED" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "RELEASED";
  claimedAt: string | null;
  confirmedAt: string | null;
  releasedReason: string | null;
  createdAt: string;
}

export interface CareFacility {
  id: string;
  name: string;
  type: "HOSPITAL" | "ORGANISASI";
  email: string;
  phone: string;
  address: string | null;
  regionCity: string;
  isVerified: boolean;
  isPaidPartner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  facilityId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
}

export type CareGuideStatus = "DRAFT" | "DITINJAU" | "AKTIF" | "DINONAKTIFKAN";

export interface CareGuide {
  id: string;
  facilityId: string;
  authorUserId: string;
  title: string;
  content: string;
  sourceNote: string | null;
  status: CareGuideStatus;
  reviewedByUserId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  facility?: { name: string } | CareFacility;
  author?: { id: string; email: string };
}

export interface AppNotification {
  id: string;
  userId: string | null;
  facilityId: string | null;
  reportId: string | null;
  type: string;
  payload: Record<string, unknown>;
  channel: string;
  isRead: boolean;
  sentAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; email: string; role: UserRole } | null;
}

export interface AnimalClass {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalReports: number;
  totalEmergency: number;
  byStatus: Partial<Record<ReportStatus, number>>;
  avgTimeToVerifyMs: number | null;
  avgTimeToClaimMs: number | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorShape {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = "ApiError";
    this.status = shape.status;
    this.code = shape.code;
    this.details = shape.details;
  }
}
