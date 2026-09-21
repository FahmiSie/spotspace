# Product Requirements Document (PRD)
## Smart Coworking Space Reservation System (SpotSpace)
**UKK RPL 2026/2027 — Paket B — Kategori Fullstack**
**Pelaksana:** Fahmi Aqila Maulana — SMK Telkom Malang

---

## 1. Latar Belakang

Pengelola coworking space membutuhkan sistem reservasi online untuk mengelola penyewaan ruangan/meja kerja (Personal Desk, Private Office, Meeting Room) oleh member (freelancer, mahasiswa, startup, profesional). Sistem mendukung dua peran pengguna: **Member/Pengunjung** dan **Admin Pengelola Space**, dengan alur reservasi, promo diskon, check-in/check-out terintegrasi, serta pelaporan pendapatan.

## 2. Tujuan Produk

- Memberi kemudahan member untuk mencari, membandingkan, dan memesan space kerja secara online.
- Memberi kontrol penuh kepada admin atas ketersediaan space, harga, promo, dan operasional harian (check-in/out).
- Menyediakan rekapitulasi pendapatan yang akurat per bulan dan per jenis space.
- Memenuhi seluruh kriteria penilaian UKK kategori Fullstack: arsitektur monorepo modern, basis data mandiri (PostgreSQL + Prisma), autentikasi multi-role (JWT), dan CRUD lengkap.

## 3. Target Pengguna & Role

| Role | Deskripsi |
|---|---|
| **Member** | Pengguna yang mendaftar untuk mencari dan memesan space kerja |
| **Admin Space** | Pengelola lokasi coworking yang mendaftarkan lokasinya dan mengelola operasional |

## 4. Ruang Lingkup Fitur

### 4.1 Member / Pengunjung

| # | Fitur | Detail |
|---|---|---|
| M1 | Register akun | Nama lengkap, instansi (opsional), no. telepon, alamat, username, password, foto profil |
| M2 | Login | Autentikasi JWT (Standar kredensial username & password) |
| M3 | Katalog space | Grid listing dengan filter (Tipe, Range Harga, Kapasitas, Pencarian, toggle "Nearest"), detail space lengkap dengan galeri foto |
| M4 | Cek ketersediaan | Pengecekan real-time ketersediaan jadwal tanpa overlap sebelum booking |
| M5 | Reservasi space | Pilih tanggal, jam mulai, durasi, kode promo (opsional) |
| M6 | Status pemesanan | Pending Approval (`belum_dikonfirm`) → Approved (`disetujui`) → Active (`aktif`) → Completed (`selesai`) / Cancelled (`dibatalkan`) |
| M7 | Histori pemesanan | Riwayat pemesanan aktif dan arsip pemesanan selesai |
| M8 | E-Ticket | Kode booking unik + QR Code base64 untuk verifikasi check-in |
| M9 | Pembatalan reservasi | Pembatalan mandiri untuk status `belum_dikonfirm` atau `disetujui` |
| M10 | Wishlist & Review | Simpan space favorit dan berikan rating (1-5), ulasan, serta quick tags untuk reservasi yang telah selesai |

### 4.2 Admin Pengelola Space

| # | Fitur | Detail |
|---|---|---|
| A1 | Register lokasi | Nama coworking, nama pemilik, telepon, akun admin |
| A2 | Login | Autentikasi JWT, role `admin_space` |
| A3 | Profil lokasi & operasional | Informasi coworking, deskripsi, alamat, kontak, koordinat geolokasi, dan jam operasional |
| A4 | CRUD member | Kelola direktori member (tambah, lihat, ubah, hapus) |
| A5 | CRUD space & galeri | Kelola unit space, tarif per jam, kapasitas, thumbnail, serta multi-foto galeri |
| A6 | CRUD diskon/promo | Kelola kode promo, persentase diskon, dan periode masa berlaku |
| A7 | Manajemen reservasi | Konfirmasi status, check-in tamu (status `aktif`), check-out tamu (status `selesai`) |
| A8 | Filter & pencarian reservasi | Filter berdasarkan status, rentang waktu, dan kata kunci |
| A9 | Dashboard analitik & laporan | Metrik live overview, rekapitulasi pendapatan bulanan, breakdown per tipe, dan export dokumen (PDF & Excel) |

## 5. Alur Bisnis Utama

### 5.1 Alur Reservasi (Member)
1. Member login → eksplorasi katalog space → pilih space.
2. Cek ketersediaan jadwal (`jam_mulai_baru < jam_selesai_existing AND jam_selesai_baru > jam_mulai_existing`).
3. Input kode promo (opsional) → sistem menghitung otomatis: `total_harga_awal`, `potongan_diskon`, `total_bayar`.
4. Submit reservasi → status awal `belum_dikonfirm` (kode booking unik: `BOOK-YYYYMMDD-XXXX`).
5. Admin menyetujui reservasi → status berubah menjadi `disetujui`.
6. Pada jadwal pemesanan, admin melakukan check-in tamu → status menjadi `aktif` (`checkInTime` tercatat).
7. Setelah durasi selesai, admin melakukan check-out tamu → status menjadi `selesai` (`checkOutTime` tercatat).
8. Member dapat mengakses e-ticket ber-QR Code sejak reservasi dibuat hingga selesai.

### 5.2 Alur Validasi Promo
1. Member memasukkan nama diskon saat proses pemesanan.
2. Sistem memvalidasi apakah promo terdaftar dan waktu pemesanan berada di antara `tanggalAwal` dan `tanggalAkhir`.
3. Jika valid: `potonganDiskon = totalHargaAwal * (persentaseDiskon / 100)`.
4. Jika tidak valid/kadaluarsa: sistem mengembalikan pesan peringatan tanpa menghentikan alur reservasi reguler.

### 5.3 Alur Rekapitulasi Pendapatan
1. Admin memilih filter bulan dan tahun pada menu analitik.
2. Sistem mengagregasi data reservasi berstatus `selesai`, `aktif`, dan `disetujui`.
3. Tampilan merangkum total pendapatan kotor, total potongan promo, realisasi pendapatan bersih, okupansi, serta rincian per kategori space.

## 6. Model Data (Prisma ORM)

- **User**: ID, username (unik), password (hash bcrypt), role (`member`, `admin_space`), timestamps.
- **Member**: Relasi 1-1 User, namaMember, instansi, alamat, telp, foto.
- **SpaceOwner**: Relasi 1-1 User, namaCoworking, namaPemilik, telp, deskripsi, alamat, latitude, longitude.
- **Space**: Relasi n-1 SpaceOwner, namaSpace, hargaPerJam, tipe (`desk`, `meeting_room`, `private_office`), kapasitas, deskripsi, foto.
- **SpaceFoto**: Relasi n-1 Space, url, urutan.
- **Diskon**: namaDiskon (unik), persentaseDiskon, tanggalAwal, tanggalAkhir.
- **Reservasi**: Relasi n-1 Member, kodeBooking (unik), tanggalReservasi, jamMulai, jamSelesai, durasiJam, status (`belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`), checkInTime, checkOutTime.
- **DetailReservasi**: Relasi 1-1 Reservasi, spaceId, diskonId (opsional), hargaPerJam, totalHargaAwal, potonganDiskon, totalBayar.
- **Review**: Relasi n-1 Space & Member, rating (1-5), komentar, tags array.
- **Wishlist**: Relasi n-1 Space & Member (toggle favorit).
- **Notifikasi**: Relasi n-1 User, tipe notifikasi, judul, pesan, status baca (`isRead`).

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Bahasa Antarmuka (UI)** | **100% English UI**. Seluruh teks antarmuka, dialog, validasi form, notifikasi toast, dan badge status di frontend konsisten berbahasa Inggris tanpa pencampuran bahasa. |
| **Keamanan & Validasi** | Enkripsi kata sandi menggunakan bcrypt (min. salt 10), autentikasi JWT stateless via Passport.js, otorisasi berbasis Role Guard, sanitasi DTO backend (`class-validator`), dan validasi form frontend (`Zod`). |
| **Manajemen State & Cache** | TanStack Query v5 dengan auto cache invalidation real-time pasca mutasi data, Zustand untuk persistensi state auth. |
| **Desain & Responsivitas** | Tailwind CSS v4, font Space Grotesk (display/angka) dan Inter (body UI), palet monokrom kontras tinggi dengan aksen oranye flame, layout responsif (desktop, tablet, mobile). |
| **Deployability** | Containerization penuh multi-service via Docker Compose (PostgreSQL, NestJS API, Next.js standalone, Nginx reverse proxy dengan SSL Certbot). |

## 8. Kriteria Penerimaan (Definition of Done)

- [x] Seluruh alur reservasi (M1–M10) dan operasional admin (A1–A9) berfungsi end-to-end.
- [x] Autentikasi multi-role (member & admin_space) bekerja aman dengan JWT.
- [x] Perhitungan biaya sewa, durasi otomatis, dan potongan promo terverifikasi akurat.
- [x] Validasi ketersediaan jadwal mencegah konflik double booking.
- [x] E-ticket terbit dengan QR Code dinamis yang valid.
- [x] Dashboard analitik menyajikan data metrik dan chart berbasis data aktual dari database.
- [x] Build backend dan frontend lolos pengujian tanpa error (`tsc --noEmit` & `npm run build`).
- [ ] Kontainer aplikasi berjalan terisolasi via Docker Compose di server VPS.
- [ ] Domain kustom aktif dengan sertifikat HTTPS (SSL Let's Encrypt).

## 9. Arahan Desain Frontend

- **Palet Warna**:
  - `Ink` (`#0B0909` / `#1A1C1C`): Navbar, sidebar, heading tegas, kartu kontras tinggi.
  - `Paper` (`#FFFFFF` / `#F9F9F9`): Latar belakang utama konten dan area kerja.
  - `Flame` (`#EF6905`): Satu-satunya warna aksen untuk tombol CTA, badge aktif, progress bar, dan garis penanda status.
  - `Stone` (`#E5E5E5` / `#C9C4B8`): Garis batas (border 1px) tipis tanpa drop shadow tebal.
- **Tipografi**: Space Grotesk untuk headline dan angka metrik besar, Inter untuk label UI dan tabel data.
- **Pola Interaksi**:
  - Katalog menggunakan tata letak Grid/List murni (bukan split-view peta tetap).
  - Dialog modal CRUD menggunakan layout terstruktur dengan dropzone upload interaktif.
  - Notifikasi umpan balik menggunakan sistem toast terpusat berbahasa Inggris setelah dialog tertutup.

## 10. Status Progress

- ✅ **Backend (Fase 0-8)**: Selesai 100%, teruji end-to-end dengan Postman.
- ✅ **Fitur Ekstra (Fase 7.5)**: Review, wishlist, galeri foto, notifikasi, geolokasi/haversine, dan export laporan (PDF/Excel) tuntas.
- ✅ **Frontend Member (Fase 11)**: Selesai 100% (Auth, Catalog, Detail Space, Booking Widget, Status Reservasi, E-ticket, Wishlist, Profile).
- ✅ **Frontend Admin (Fase 5-7)**: Selesai 100% (Dashboard Overview modern, CRUD Space, CRUD Member, CRUD Diskon, Kelola Reservasi, Location Profile, Reports & Analytics).
- ✅ **Audit & Sinkronisasi API**: Selesai 100% (Sinkronisasi payload dan perbaikan global cache invalidation TanStack Query).
- 🔄 **Deployment (Fase 9)**: Siap dieksekusi (VPS GCP Compute Engine, domain Name.com, Nginx, Docker Compose, SSL Certbot).
- ⏸️ **Payment Gateway (Fase 10, bonus)**: Ditunda hingga deployment Fase 9 selesai.

## 11. Batasan Scope (Out of Scope untuk UKK)

- **Reset Password via Email/OTP**: Ditunda ke pengembangan pasca-UKK (Skenario A) untuk menjaga konsistensi skema penilaian backend panitia.
- **Aduan Fasilitas**: Disimpan untuk roadmap pasca-UKK.
- **Multi-bahasa Dinamis (i18n)**: Sistem dibakukan langsung dalam 100% bahasa Inggris.
- **Real-time WebSocket**: Pembaruan data operasional mengandalkan polling dan invalidasi cache TanStack Query.