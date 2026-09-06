# AGENT BRIEF — Smart Coworking Space Reservation System
**Untuk digunakan oleh AI coding agent (Google Antigravity / setara)**
Dokumen ini adalah rujukan TUNGGAL dan LENGKAP. Agent harus mengikuti dokumen ini secara eksplisit — jangan berasumsi di luar yang tertulis di sini. Jika ada ambiguitas, agent WAJIB berhenti dan bertanya, bukan menebak.

---

## 0. Ringkasan Proyek

- **Nama:** Smart Coworking Space Reservation System (spotspace)
- **Konteks:** Proyek Uji Kompetensi Keahlian (UKK) RPL — dinilai oleh penguji sekolah
- **Kategori:** Fullstack (backend + frontend dibangun sendiri, basis data mandiri)
- **Referensi lengkap requirement:** lihat `docs/PRD.md` di repo yang sama (dokumen terpisah, sudah dibuat)
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
spotspace/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── auth/              # register, login, JWT strategy, guards, roles
│   │   │   ├── users/             # shared user logic jika perlu
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
│       │   │   ├── (member)/spaces/, reservasi/, profile/
│       │   │   └── (admin)/dashboard/, members/, spaces/, diskon/, reservasi/, reports/
│       │   ├── components/
│       │   ├── lib/               # axios instance, zustand store, zod schemas
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

Adaptasi dari ERD panitia. Nama tabel/kolom boleh disesuaikan gaya penamaan tapi **field dan relasi tidak boleh dikurangi**.

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
```

## 4. Aturan Bisnis Eksplisit (WAJIB diimplementasi persis)

1. **Cek ketersediaan space**: sebuah space TIDAK bisa dipesan jika ada reservasi lain (status bukan `dibatalkan`) pada `spaceId` yang sama dengan rentang jam yang overlap di tanggal yang sama. Overlap check: `jam_mulai_baru < jam_selesai_existing AND jam_selesai_baru > jam_mulai_existing`.
2. **jam_selesai** dihitung otomatis: `jam_mulai + durasi_jam` (bukan input manual).
3. **Perhitungan harga**:
   - `total_harga_awal = harga_per_jam * durasi_jam`
   - Jika ada diskon valid: `potongan_diskon = total_harga_awal * (persentase_diskon / 100)`
   - `total_bayar = total_harga_awal - potongan_diskon`
4. **Validasi kode promo**: valid hanya jika `now()` berada di antara `tanggal_awal` dan `tanggal_akhir` diskon tersebut.
5. **kode_booking** di-generate otomatis format: `BOOK-YYYYMMDD-{id_padded_4_digit}`.
6. **Transisi status reservasi** (hanya arah ini yang diperbolehkan):
   `belum_dikonfirm → disetujui → aktif → selesai`
   `belum_dikonfirm / disetujui → dibatalkan` (oleh member atau admin)
   Status `aktif` hanya bisa dicapai lewat endpoint check-in (bukan lewat update status biasa).
   Status `selesai` hanya bisa dicapai lewat endpoint check-out.
7. **Member hanya bisa membatalkan reservasi miliknya sendiri**, dan hanya jika status masih `belum_dikonfirm` atau `disetujui`.
8. **Role guard**: endpoint admin (`/admin/*`) hanya bisa diakses role `admin_space`; endpoint member hanya bisa diakses role `member`. Gunakan NestJS Guards + custom `@Roles()` decorator.
9. **Password** wajib di-hash dengan bcrypt (salt rounds minimal 10) sebelum disimpan, tidak pernah dikembalikan di response manapun.
10. **QR Code e-ticket**: payload berisi minimal `kode_booking` + `reservasi_id`, digenerate di backend (gunakan library `qrcode`), dikembalikan sebagai base64 image atau URL.

## 5. Breakdown Tugas per Fase (Agent mengerjakan berurutan, checklist per fase)

### FASE 0 — Setup Awal
- [ ] Init monorepo, struktur folder sesuai Bagian 2
- [ ] Setup `docker-compose.yml`: service `postgres`, `backend`, `frontend`, `nginx`
- [ ] Setup Prisma schema sesuai Bagian 3, jalankan migrasi awal
- [ ] Setup `.env.example` di masing-masing app (JWT_SECRET, DATABASE_URL, PORT, dll.)
- [ ] Setup ESLint + Prettier konsisten di backend & frontend

### FASE 1 — Autentikasi
- [ ] Endpoint register member (dengan upload foto opsional)
- [ ] Endpoint register admin_space
- [ ] Endpoint login (return JWT + role)
- [ ] Guard JWT + Roles decorator
- [ ] Frontend: halaman login & register (member dan admin, bisa dipisah route)
- [ ] Zustand store untuk auth state + token persistence

### FASE 2 — Modul Space & Katalog
- [ ] CRUD space (admin)
- [ ] Endpoint publik: list space (filter tipe, search), detail space
- [ ] Endpoint cek ketersediaan (implementasi aturan bisnis #1)
- [ ] Upload foto space
- [ ] Frontend: halaman katalog space (member), form CRUD space (admin)

### FASE 3 — Modul Diskon
- [ ] CRUD diskon (admin)
- [ ] Endpoint publik: list diskon aktif, cek validitas kode promo
- [ ] Frontend: halaman kelola diskon (admin), input kode promo di form reservasi (member)

### FASE 4 — Modul Reservasi (Member)
- [ ] Endpoint create reservasi (implementasi aturan bisnis #2, #3, #4, #5)
- [ ] Endpoint list reservasi milik sendiri, histori per bulan
- [ ] Endpoint detail reservasi, cancel reservasi (aturan bisnis #7)
- [ ] Endpoint generate/lihat e-ticket dengan QR Code (aturan bisnis #10)
- [ ] Frontend: form buat reservasi, halaman status pesanan, histori, halaman e-ticket

### FASE 5 — Modul Reservasi (Admin)
- [ ] Endpoint list semua reservasi (filter status, bulan, space, tanggal)
- [ ] Endpoint update status reservasi (konfirmasi/tolak) — aturan bisnis #6
- [ ] Endpoint check-in, check-out — aturan bisnis #6
- [ ] Frontend: dashboard kelola reservasi, detail reservasi, tombol aksi status/check-in/out

### FASE 6 — Modul Member & Profil (Admin)
- [ ] CRUD member oleh admin
- [ ] Update profil lokasi coworking
- [ ] Frontend: halaman kelola member, halaman edit profil lokasi

### FASE 7 — Laporan
- [ ] Endpoint rekapitulasi pendapatan per bulan (agregasi sesuai contoh response di kontrak API panitia)
- [ ] Frontend: dashboard laporan dengan chart per tipe space

### FASE 8 — Testing & Dokumentasi
- [ ] Test manual end-to-end seluruh alur (checklist Bagian 6)
- [ ] Export Postman collection seluruh endpoint
- [ ] Tulis README: cara menjalankan lokal (`docker compose up`), struktur env
- [ ] Screenshot/rekam alur utama untuk dokumentasi

### FASE 9 — Deployment
- [ ] Provision VPS di GCP Compute Engine
- [ ] Setup domain (A record ke IP VPS)
- [ ] Setup Nginx reverse proxy (frontend di `/`, backend di `/api` atau subdomain `api.`)
- [ ] Setup SSL via Certbot
- [ ] Deploy via `docker compose up -d` di VPS
- [ ] Smoke test seluruh fitur di environment production

## 6. Checklist Definition of Done (Final)

- [ ] Semua endpoint di Bagian 5 berfungsi dan teruji lewat Postman
- [ ] Autentikasi role-based bekerja benar (member tidak bisa akses endpoint admin dan sebaliknya)
- [ ] Perhitungan harga/diskon 100% akurat sesuai aturan bisnis #3
- [ ] Validasi overlap jadwal booking bekerja (tidak bisa double booking)
- [ ] E-ticket dengan QR Code bisa ditampilkan/diunduh
- [ ] Laporan pendapatan menampilkan angka yang benar
- [ ] Aplikasi jalan penuh dari `docker compose up` tanpa error, baik lokal maupun VPS
- [ ] Domain aktif dengan HTTPS valid
- [ ] README lengkap dan bisa diikuti orang lain dari nol
- [ ] Tidak ada credential/secret ter-commit ke repo (cek `.gitignore` untuk `.env`)

## 7. Batasan & Hal yang TIDAK Perlu Dikerjakan

- Tidak perlu payment gateway sungguhan — cukup catat `total_bayar`.
- Tidak perlu notifikasi email/SMS.
- Tidak perlu multi-bahasa.
- Tidak perlu real-time (WebSocket) kecuali agent punya waktu lebih setelah semua checklist Bagian 6 selesai.

## 8. Aturan Kerja untuk Agent

1. Selesaikan fase secara berurutan (jangan lompat ke Fase 4 sebelum Fase 0–3 selesai dan teruji).
2. Setiap selesai satu fase, jalankan test manual singkat sebelum lanjut.
3. Commit per fase dengan pesan jelas (contoh: `feat(backend): implement space availability check`).
4. Jika instruksi di sini bertentangan dengan asumsi umum coding best practice, prioritaskan dokumen ini — ini rujukan resmi untuk penilaian UKK.
5. Jika ada kebutuhan yang tidak tercakup di dokumen ini saat implementasi, STOP dan tanyakan ke user, jangan improvisasi fitur baru di luar scope.
