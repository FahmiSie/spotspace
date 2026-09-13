# SpotSpace

Aplikasi Reservasi Coworking Space & Workstation (Smart Space Booking) — Uji Kompetensi Keahlian (UKK) RPL 2026/2027, Paket B, Kategori Fullstack.

**Dibuat oleh:** Fahmi Aqila Maulana — SMK Telkom Malang

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | NestJS (TypeScript), Prisma ORM, PostgreSQL |
| Frontend | Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui |
| Auth | JWT (Passport.js), role-based: `member` & `admin_space` |
| Infra | Docker & Docker Compose |
| API Docs | Swagger (`/docs`) |

## Struktur Proyek

```
spotspace/
├── apps/
│   ├── backend/        # NestJS API
│   └── frontend/       # Next.js web app
├── backend.Dockerfile
├── frontend.Dockerfile
├── docker-compose.yml
├── docs/
│   ├── PRD.md
│   ├── AGENT_BRIEF.md
│   └── SpotSpace.postman_collection.json
└── README.md
```

## Menjalankan Aplikasi (Docker — Direkomendasikan)

### Prasyarat
- Docker Desktop terinstall dan berjalan
- Git

### Langkah

1. Clone repository dan masuk ke foldernya:
   ```bash
   git clone <url-repo-anda>
   cd spotspace
   ```

2. Buat file `.env` di root project (sejajar `docker-compose.yml`):
   ```env
   JWT_SECRET=ganti_dengan_secret_acak_yang_kuat
   APP_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. Build dan jalankan seluruh service:
   ```bash
   docker compose up --build
   ```

   Proses ini akan otomatis:
   - Menjalankan PostgreSQL
   - Menjalankan migrasi database (`prisma migrate deploy`)
   - Menjalankan backend NestJS di port `3000`
   - Menjalankan frontend Next.js di port `3001`

4. Akses aplikasi:
   - Frontend: [http://localhost:3001](http://localhost:3001)
   - Backend API: [http://localhost:3000/api](http://localhost:3000/api)
   - Dokumentasi API (Swagger): [http://localhost:3000/docs](http://localhost:3000/docs)
   - Health check: [http://localhost:3000/health](http://localhost:3000/health)

5. Menghentikan aplikasi:
   ```bash
   docker compose down
   ```
   Tambahkan `-v` (`docker compose down -v`) kalau ingin menghapus data database juga.

## Menjalankan Tanpa Docker (Development)

Kalau ingin development lebih cepat dengan hot-reload di luar container:

### Backend

```bash
cd apps/backend
npm install

# Jalankan hanya database via Docker
docker compose up -d postgres

# Buat .env terpisah di apps/backend/.env
echo 'DATABASE_URL="postgresql://spotspace:spotspace_dev_password@localhost:5432/spotspace_db?schema=public"
JWT_SECRET="secret_dev_anda"
PORT=3000
APP_URL="http://localhost:3000"' > .env

npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd apps/frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000/api' > .env.local
npm run dev
```

## Kredensial Testing (Contoh)

Setelah aplikasi berjalan, buat akun testing melalui endpoint register, atau gunakan Postman collection di `docs/SpotSpace.postman_collection.json` yang sudah menyertakan folder Auth dengan contoh request lengkap.

## Testing

### Automated (Postman/Newman)

```bash
npm install -g newman
newman run docs/SpotSpace.postman_collection.json -e docs/SpotSpace.postman_environment.json
```

### Type checking

```bash
cd apps/backend
npx tsc --noEmit
```

## Fitur Utama

**Member:**
- Registrasi & login
- Melihat katalog space dengan filter (tipe, harga, kapasitas, pencarian)
- Reservasi space dengan kode promo
- Melihat status & histori reservasi
- Cetak e-ticket dengan QR Code
- Review & rating space
- Wishlist space favorit

**Admin Space:**
- Registrasi & login
- Kelola profil lokasi coworking
- CRUD member, space (termasuk galeri multi-foto), dan diskon/promo
- Kelola reservasi: konfirmasi, check-in, check-out
- Laporan rekapitulasi pendapatan bulanan (termasuk export PDF/Excel)

**Lainnya:**
- Notifikasi in-app (polling)
- Modul Maker independen untuk keperluan verifikasi App Key (lihat `docs/AGENT_BRIEF.md`)

## Dokumentasi Tambahan

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document lengkap
- [`docs/AGENT_BRIEF.md`](docs/AGENT_BRIEF.md) — spesifikasi teknis, skema database, dan aturan bisnis detail
- Swagger UI (`/docs`) — dokumentasi interaktif seluruh endpoint API

## Lisensi

Proyek ini dibuat untuk keperluan Uji Kompetensi Keahlian (UKK) dan bersifat non-komersial.