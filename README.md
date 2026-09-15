# Animal SelfCare — Frontend

Antarmuka web untuk **Animal SelfCare**, platform pelaporan dan penanganan hewan terlantar di Kota Kupang.
Aplikasi ini murni mengonsumsi **Backend REST API + SSE** — tidak ada logic bisnis di frontend
(validasi status, aturan klaim, RBAC ditegakkan backend; UI hanya menampilkan data, memanggil API,
dan menangani response/error termasuk `403`/`409`).

Backend: https://github.com/Petra-Miracle/Animal-SelfCare-BE

## Tech stack

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS**
- **HeroUI v2** — pola konsisten untuk aksi & formulir (Button, Card, Input, Select, Modal, Table, Pagination, Chip, Navbar, …)
- **Flowbite React** — pola konsisten untuk tampilan konten (Footer, Accordion panduan, Timeline alur)
- **Lucide React** — semua ikon
- **Framer Motion** — animasi transisi secukupnya (fade/slide antar langkah & kartu)
- Navbar memakai komponen `components/pro-navbar.tsx` — replika setia API
  [HeroUI Pro Navbar](https://heroui.pro/docs/react/components/navbar) (dot-notation:
  `Navbar.Header/Brand/Content/Item/MenuToggle/Menu/MenuItem`, `hideOnScroll`,
  routing Next.js via prop `navigate`). Paket `@heroui-pro` asli sengaja tidak dipakai
  karena butuh lisensi berbayar + React 19 + Tailwind v4.
- Bahasa antarmuka: **Bahasa Indonesia**, mobile-first
- Font **Plus Jakarta Sans**, warna merek `brand` custom + radius besar via plugin HeroUI

Komponen HeroUI v2 yang dipakai di seluruh aplikasi: Accordion, Alert, Autocomplete,
Avatar, Badge, Breadcrumbs, Button, ButtonGroup, Card, Checkbox, Chip, CircularProgress,
Code, DatePicker, Divider, Drawer, Dropdown, Form, Image, Input, Kbd, Link, Modal,
NumberInput, Pagination, Popover, Progress, RadioGroup, ScrollShadow, Select, Skeleton,
Slider, Snippet, Spacer (implisit), Spinner, Switch, Table, Tabs, Textarea, Toast
(`addToast`), Tooltip, User — plus Flowbite (Footer, Accordion panduan, Timeline alur).
Pengecualian yang sengaja tidak dipakai: Calendar/RangeCalendar/DateRangePicker/
DateInput/TimeInput mandiri (tak ada kasus filter tanggal di API), InputOtp (tak ada alur
OTP di backend), Listbox mandiri (sudah tercakup via Dropdown/Autocomplete).

## Prasyarat

- Node.js ≥ 20, npm
- Backend berjalan (lokal `http://localhost:4000` atau URL produksi)

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local   # lalu sesuaikan bila perlu
npm run dev                  # http://localhost:3000
```

Env var yang dibutuhkan:

| Variabel | Contoh | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api/v1` | Base URL backend. **Semua** request lewat variabel ini, tidak ada hardcode URL di kode. |

Build produksi:

```bash
npm run build
npm run start
```

## Struktur halaman

| Rute | Akses | Keterangan |
|---|---|---|
| `/` | publik | Hero, CTA lapor, cuplikan laporan terbaru (realtime), alur, panduan |
| `/lapor` | publik | Form multi-step: foto → lokasi & waktu → kondisi → kontak & kirim |
| `/laporan` | publik | Daftar + pencarian/filter/sort/pagination + refresh otomatis via SSE |
| `/laporan/[id]` | publik | Detail versi publik (tanpa kontak/koordinat presisi) |
| `/panduan` | publik | Panduan AKTIF + nama fasilitas penulis |
| `/login` | publik | Satu form untuk `SUPERADMIN` & `ADMIN_RS`, redirect sesuai role |
| `/admin` | SUPERADMIN | Statistik (total, per status, rata-rata verifikasi & klaim) |
| `/admin/laporan`, `/admin/laporan/[id]` | SUPERADMIN | Daftar lengkap + verifikasi/tolak/tawarkan/tutup |
| `/admin/fasilitas` | SUPERADMIN | CRUD + toggle verifikasi |
| `/admin/akun` | SUPERADMIN | Buat akun (Admin RS wajib `facilityId`) + nonaktifkan |
| `/admin/panduan` | SUPERADMIN | Tinjau & terbitkan/nonaktifkan panduan |
| `/admin/audit-log` | SUPERADMIN | Riwayat aktivitas |
| `/fasilitas` | ADMIN_RS | Laporan yang ditawarkan/ditangani + **Ambil Penanganan** (tahan 409/403) |
| `/fasilitas/laporan/[id]` | ADMIN_RS | Detail + hitung mundur klaim 20 mnt + mulai penanganan + lepas klaim |
| `/fasilitas/panduan` | ADMIN_RS | Draft milik sendiri + ajukan ditinjau |

Notifikasi in-app (ikon lonceng) tersedia untuk semua akun login dan diperbarui via SSE.

## Catatan implementasi penting

- **Token** disimpan di cookie `asc_token` (bukan `localStorage`), masa berlaku ±8 jam mengikuti JWT backend.
- **Realtime**: `lib/sse.ts` membuka `EventSource` ke `GET {API}/realtime/stream` dengan reconnect backoff;
  halaman daftar/detail me-refresh data saat event `report:*` tiba, dan toast ditampilkan untuk kejadian penting
  (mis. *"Laporan ini baru saja diambil fasilitas lain"*).
- **Klaim anti-bentrok**: `409` → pesan jelas + refresh daftar (tombol tidak stuck loading); `403` → pesan tidak ditawarkan.
- **Privasi**: halaman publik tidak pernah meminta/menampilkan kontak pelapor, koordinat presisi, maupun URL foto asli
  (API publik memang tidak mengirimnya).
- **Satu `StatusBadge`** (`components/StatusBadge.tsx`) dipakai di semua halaman agar warna/label status konsisten.

## Deploy ke Vercel

1. Import repo ini di Vercel (framework preset Next.js).
2. Isi Environment Variable `NEXT_PUBLIC_API_BASE_URL` dengan URL produksi backend (contoh `https://api-contoh.up.railway.app/api/v1`).
3. Deploy. Tidak perlu konfigurasi tambahan.
