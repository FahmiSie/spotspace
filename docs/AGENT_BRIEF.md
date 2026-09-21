Dokumen `docs/AGENT_BRIEF.md` perlu dimutakhirkan agar selaras dengan kondisi proyek saat ini:

1. **Checklist Fase (Bagian 5):** Fase 0 sampai Fase 8, Fase 7.5, dan Fase 11 (Frontend Member & Admin) sudah selesai. Checklist perlu ditandai `[x]`, dan fokus kerja resmi berpindah ke **Fase 9: Deployment**.
2. **Audit API (Bagian 9):** Semua endpoint yang telah diaudit dan disinkronkan perlu dicentang `[x]`.
3. **Catatan Skenario Auth (Skenario A):** Status login password standar dipertahankan; fitur OTP/reset password dibekukan (*frozen*) demi stabilitas skema penilaian UKK.
4. **Pedoman UI/UX Admin Panel:** Menambahkan aturan visual modern berbasis layout Stitch (Linear/Supabase-style) dengan **Strict Data Only** (larangan keras membuat data/metrik palsu seperti IoT nodes atau pacing forecast).

Berikut draf pembaruan lengkap untuk file **`docs/AGENT_BRIEF.md`**:

---

```markdown
# AGENT BRIEF — Smart Coworking Space Reservation System
**Untuk digunakan oleh AI coding agent (Google Antigravity / setara)**
Dokumen ini adalah rujukan TUNGGAL dan LENGKAP. Agent harus mengikuti dokumen ini secara eksplisit — jangan berasumsi di luar yang tertulis di sini. Jika ada ambiguitas, agent WAJIB berhenti dan bertanya, bukan menebak.

---

## 0. Ringkasan Proyek

- **Nama:** Smart Coworking Space Reservation System (SpotSpace)
- **Konteks:** Proyek Uji Kompetensi Keahlian (UKK) RPL — dinilai oleh penguji sekolah
- **Kategori:** Fullstack (backend + frontend dibangun sendiri, basis data mandiri)
- **Referensi lengkap requirement:** lihat `docs/PRD.md` di repo yang sama
- **Deadline keras:** 21 September 2026 (H-1 harus sudah full deploy + testing selesai)

## 1. Tech Stack (WAJIB, tidak boleh diganti tanpa konfirmasi user)

| Layer | Pilihan |
|---|---|
| Backend | NestJS (TypeScript) |
| Frontend | Next.js (App Router, TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL (container Docker, lokal maupun produksi) |
| Auth | JWT (Passport.js), role-based: `member` & `admin_space` |
| Validasi Backend | class-validator + class-transformer |
| Validasi Frontend | Zod + React Hook Form |
| Styling | Tailwind CSS |
| State/data fetching | TanStack Query + Zustand (auth state) |
| Package manager | npm |
| Repo | Monorepo — `apps/backend`, `apps/frontend` |
| Infra | Docker Compose (backend, frontend, postgres, nginx) |
| Deploy target | VPS (GCP Compute Engine instance) + domain custom + SSL (Certbot) |
| API docs | Swagger (`@nestjs/swagger`) auto-generate dari NestJS |
| API testing | Postman collection (export wajib) |

## 2. Struktur Folder Wajib


```

smart-coworking-ukk/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── auth/              # register, login, JWT strategy, guards, roles
│   │   │   ├── users/             # shared user logic
│   │   │   ├── members/           # CRUD member (admin-facing)
│   │   │   ├── spaces/            # CRUD space + katalog + availability check
│   │   │   ├── diskon/            # CRUD diskon + validasi kode promo
│   │   │   ├── reservasi/         # create, list, detail, cancel, e-ticket
│   │   │   ├── admin/             # profile lokasi, reservasi management, check-in/out
│   │   │   ├── reports/           # rekapitulasi pendapatan
│   │   │   ├── upload/            # upload foto (space, member, general)
│   │   │   ├── prisma/            # PrismaService
│   │   │   ├── common/            # DTO base, filters, interceptors, decorators
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login/, register/
│       │   │   ├── (member)/spaces/, reservasi/, profile/, wishlist/
│       │   │   └── (admin)/dashboard/, members/, spaces/, diskon/, reservasi/, reports/, profile/
│       │   ├── components/
│       │   ├── lib/               # axios instance, zustand store, zod schemas, hooks
│       │   └── types/             # TypeScript interfaces sinkron dengan backend DTO
│       ├── Dockerfile
│       └── .env.example
├── docker-compose.yml
├── nginx/default.conf
├── docs/
│   ├── PRD.md
│   ├── AGENT_BRIEF.md
│   ├── ERD.png
│   └── postman_collection.json
└── README.md

```

## 3. Skema Database (Prisma) — WAJIB sesuai ini

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  role      Role
  member       Member?
  spaceOwner   SpaceOwner?
  createdAt DateTime @default(now())
}

enum Role {
  member
  admin_space
}

model Member {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique
  user      User     @relation(fields: [userId], references: [id])
  namaMember String
  instansi   String?
  alamat     String
  telp       String
  foto       String?
  reservasi  Reservasi[]
}

model SpaceOwner {
  id            Int      @id @default(autoincrement())
  userId        Int      @unique
  user          User     @relation(fields: [userId], references: [id])
  namaCoworking String
  namaPemilik   String
  telp          String
  deskripsi     String?
  alamat        String?
  latitude      Float?
  longitude     Float?
  spaces        Space[]
}

model Space {
  id            Int      @id @default(autoincrement())
  namaSpace     String
  hargaPerJam   Float
  tipe          TipeSpace
  kapasitas     Int
  deskripsi     String?
  foto          String?
  ownerId       Int
  owner         SpaceOwner @relation(fields: [ownerId], references: [id])
  detailReservasi DetailReservasi[]
  fotos         SpaceFoto[]
  reviews       Review[]
  wishlists     Wishlist[]
}

enum TipeSpace {
  desk
  meeting_room
  private_office
}

model Diskon {
  id                Int      @id @default(autoincrement())
  namaDiskon        String   @unique
  persentaseDiskon  Float
  tanggalAwal       DateTime
  tanggalAkhir      DateTime
  detailReservasi   DetailReservasi[]
}

model Reservasi {
  id               Int       @id @default(autoincrement())
  kodeBooking      String    @unique
  memberId         Int
  member           Member    @relation(fields: [memberId], references: [id])
  tanggalReservasi DateTime
  jamMulai         String
  jamSelesai       String
  durasiJam        Int
  status           StatusReservasi @default(belum_dikonfirm)
  checkInTime      DateTime?
  checkOutTime     DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  detail           DetailReservasi?
}

enum StatusReservasi {
  belum_dikonfirm
  disetujui
  aktif
  selesai
  dibatalkan
}

model DetailReservasi {
  id               Int       @id @default(autoincrement())
  reservasiId      Int       @unique
  reservasi        Reservasi @relation(fields: [reservasiId], references: [id])
  spaceId          Int
  space            Space     @relation(fields: [spaceId], references: [id])
  diskonId         Int?
  diskon           Diskon?   @relation(fields: [diskonId], references: [id])
  hargaPerJam      Float
  totalHargaAwal   Float
  potonganDiskon   Float     @default(0)
  totalBayar       Float
}

model SpaceFoto {
  id      Int    @id @default(autoincrement())
  spaceId Int
  space   Space  @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  url     String
  urutan  Int    @default(0)
}

model Review {
  id        Int      @id @default(autoincrement())
  spaceId   Int
  space     Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  memberId  Int
  member    Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  rating    Int
  komentar  String?
  tags      String[]
  createdAt DateTime @default(now())

  @@unique([spaceId, memberId])
}

model Wishlist {
  id        Int      @id @default(autoincrement())
  memberId  Int
  member    Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  spaceId   Int
  space     Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([memberId, spaceId])
}

enum TipeNotifikasi {
  reservasi_dibuat
  reservasi_dikonfirmasi
  reservasi_dibatalkan
  check_in
  check_out
  promo_baru
}

model Notifikasi {
  id        Int            @id @default(autoincrement())
  userId    Int
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  tipe      TipeNotifikasi
  judul     String
  pesan     String
  isRead    Boolean        @default(false)
  createdAt DateTime       @default(now())
}

```

---

## 3.2 Design System Frontend (WAJIB)

### Warna Token

| Token | Hex | Peran |
| --- | --- | --- |
| `ink` | `#0B0909` | Hitam solid — navbar, sidebar, card kontras tinggi, heading |
| `paper` | `#FFFFFF` / `#F9F9F9` | Putih / soft paper — background section konten & data table |
| `flame` | `#EF6905` | Oranye — SATU-SATUNYA warna aksen: CTA, highlights, active indicator, progress bar |
| `stone` | `#E5E5E5` / `#C9C4B8` | Border/divider 1px tipis, chip filter netral |

### Status Reservasi Token

| Status | Token | Hex | Label UI |
| --- | --- | --- | --- |
| `belum_dikonfirm` | `status-pending` | `#E0A438` | Pending Approval |
| `disetujui` | `status-confirmed` | `#2F5D50` | Approved |
| `aktif` | `status-active` | `#3B5BA5` | Active |
| `selesai` | `status-done` | `#6B665A` | Completed |
| `dibatalkan` | `status-cancelled` | `#B0523A` | Cancelled |

### Tipografi

* **Display/headline/angka**: Space Grotesk (`font-display`)
* **Body/UI**: Inter (`font-body`)

### Pedoman Desain Admin Panel (Stitch/Linear-Style)

* **Strict Real Data**: HANYA tampilkan metrik dari endpoint nyata (`members.length`, `spaces.length`, `reports/monthly`, pending reservations count). DILARANG MENAMBAH DUMMY DATA (misal: "Operations Node", "IoT telemetry", "Platform Commission").
* **Currency Format**: Format mata uang WAJIB Rupiah ("Rp 148.920.000"), BUKAN dollar ("$").
* **Avatar Handling**: Gunakan inisial bulat berseri atau foto profil yang valid via helper `getAssetUrl()`. Hindari URL foto stok eksternal yang tidak ada di storage lokal/backend.
* **Katalog Member**: LIST/GRID murni, bukan split-view peta.

---

## 4. Aturan Bisnis Eksplisit

1. **Cek Ketersediaan Space**: Overlap check: `jam_mulai_baru < jam_selesai_existing AND jam_selesai_baru > jam_mulai_existing` pada tanggal yang sama untuk reservasi selain `dibatalkan`.
2. **Hitung Otomatis**: `jam_selesai = jam_mulai + durasi_jam`.
3. **Perhitungan Harga**: `total_harga_awal = harga_per_jam * durasi_jam`. Potongan diskon = `total_harga_awal * (persentase_diskon / 100)`. `total_bayar = total_harga_awal - potongan_diskon`.
4. **Validasi Diskon**: Menggunakan payload field `nama_diskon` (bukan `kode_diskon`). Berlaku jika `now()` di antara `tanggalAwal` dan `tanggalAkhir`.
5. **Format Kode Booking**: `BOOK-YYYYMMDD-{id_padded_4_digit}`.
6. **Siklus Status Reservasi**:
`belum_dikonfirm → disetujui → aktif → selesai`
`belum_dikonfirm / disetujui → dibatalkan`
Status `aktif` hanya via endpoint `/check-in`; status `selesai` hanya via endpoint `/check-out`.
7. **Otorisasi Pembatalan**: Member hanya bisa membatalkan reservasi miliknya saat status masih `belum_dikonfirm` atau `disetujui`.
8. **Auth Strategy**: **Skenario A** diterapkan. Login menggunakan standar `username` & `password`. Fitur OTP/Reset password dinonaktifkan di antarmuka untuk menjaga kestabilan skema penilaian UKK.
9. **Dialog & Feedback Rule**: Saat aksi submit/delete/cancel berhasil, TUTUP DIALOG TERLEBIH DAHULU (`setOpen(false)`), baru tampilkan toast notification.

---

## 5. Checklist Kemajuan Tugas

### FASE 0 — Setup Awal

* [x] Monorepo setup (`apps/backend`, `apps/frontend`)
* [x] Docker Compose lokal & Prisma schema awal
* [x] Konfigurasi environment & linter

### FASE 1 — Autentikasi

* [x] Register Member & Admin Space
* [x] Login JWT + Role Guard + Zustand Auth Store

### FASE 2 — Modul Space & Katalog

* [x] CRUD Space Admin & Upload Foto
* [x] Endpoint publik katalog, filter, availability check

### FASE 3 — Modul Diskon

* [x] CRUD Diskon Admin
* [x] Verifikasi promo di backend & sinkronisasi frontend

### FASE 4 & 5 — Modul Reservasi

* [x] Create reservasi member (payload key `tanggal_reservasi`)
* [x] Cancel reservasi member & generate E-Ticket QR Code
* [x] Admin approve, reject, check-in, dan check-out

### FASE 6 & 7 — Modul Member, Profil, & Laporan

* [x] CRUD Member Admin
* [x] Profil lokasi & sinkronisasi foto profil Navbar
* [x] Laporan pendapatan bulanan & grafik analitik
* [x] Export laporan (PDF & Excel)

### FASE 7.5 — Fitur Ekstra

* [x] Review & rating (1-5 + tags)
* [x] Wishlist (toggle add/remove)
* [x] Galeri multi-foto space
* [x] In-app notification polling

### FASE 8 — Testing & Verifikasi Kode

* [x] Perbaikan global cache invalidation TanStack Query (`["admin", "members"]`, `["admin", "spaces"]`, dll.)
* [x] `npx tsc --noEmit` & `npm run build` bebas error di backend & frontend

### FASE 9 — Deployment (FOKUS AKTIF)

* [ ] Provision VM GCP Compute Engine (Ubuntu, Static IP)
* [ ] Konfigurasi DNS Name.com (A Record frontend & backend)
* [ ] Siapkan `docker-compose.prod.yml` & `nginx/prod.conf`
* [ ] Setup SSL otomatis Certbot (HTTPS)
* [ ] Smoke test production

---

## 9. Status Sinkronisasi API (Audit Selesai 100%)

* [x] Auth: `/api/auth/register/*`, `/api/auth/login`, `/api/auth/profile`
* [x] Spaces: `/api/spaces`, `/api/spaces/:id`, `/api/admin/spaces`
* [x] Diskon: `/api/diskon/check` (payload `nama_diskon`), `/api/admin/diskon`
* [x] Reservasi: `/api/reservasi` (payload `tanggal_reservasi`), `/api/reservasi/my`, `/api/reservasi/admin/all`
* [x] Profil: `/api/member/profile`, `/api/member/profile/foto`, `/api/admin/profile`
* [x] Reports: `/api/admin/reports/monthly`, `/api/admin/reports/monthly/export`
* [x] Upload: `/api/upload` (single & multiple)

---

## 12. Aturan Kerja Agen (Strict)

1. **Strict English UI**: DILARANG mencampur bahasa Indonesia pada antarmuka frontend (label, tombol, pesan error/toast, header).
2. **Deterministic State**: Selalu gunakan `queryClient.invalidateQueries` dengan query key eksplisit setelah setiap aksi mutasi agar UI ter-update tanpa refresh manual.
3. **No Assumptions on Data**: Jangan pernah membuat data statistik tiruan/fiktif di halaman admin yang tidak didukung oleh database nyata.
4. **Safety & Stability First**: Jangan mengubah skema database Prisma tanpa instruksi eksplisit dari pengguna.

```

```