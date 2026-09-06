# Product Requirements Document (PRD)
## Smart Coworking Space Reservation System
**UKK RPL 2026/2027 — Paket B — Kategori Fullstack**
**Pelaksana:** Fahmi Aqila Maulana — SMK Telkom Malang

---

## 1. Latar Belakang

Pengelola coworking space membutuhkan sistem reservasi online untuk mengelola penyewaan ruangan/meja kerja (Personal Desk, Private Office, Meeting Room) oleh member (freelancer, mahasiswa, startup, profesional). Sistem harus mendukung dua peran pengguna: **Member/Pengunjung** dan **Admin Pengelola Space**, dengan alur reservasi, promo diskon, dan check-in/check-out yang terintegrasi.

## 2. Tujuan Produk

- Memberi kemudahan member untuk mencari, membandingkan, dan memesan space kerja secara online.
- Memberi kontrol penuh kepada admin atas ketersediaan space, harga, promo, dan operasional harian (check-in/out).
- Menyediakan laporan pendapatan yang akurat per bulan dan per jenis space.
- Memenuhi seluruh kriteria penilaian UKK kategori Fullstack: SSR, basis data mandiri, autentikasi multi-role, CRUD lengkap.

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
| M2 | Login | Autentikasi JWT |
| M3 | Lihat katalog space | Filter tipe (Personal Desk/Private Office/Meeting Room), lihat foto, kapasitas, fasilitas, harga/jam |
| M4 | Cek ketersediaan | Berdasarkan tanggal & jam sebelum booking |
| M5 | Reservasi space | Pilih tanggal, jam mulai, durasi, kode promo (opsional) |
| M6 | Lihat status pemesanan | Belum Dikonfirmasi → Disetujui → Aktif/Digunakan → Selesai / Dibatalkan |
| M7 | Histori pemesanan | Filter per bulan |
| M8 | Cetak e-ticket | Kode reservasi + QR Code untuk check-in |
| M9 | Batalkan reservasi | Hanya untuk status yang memungkinkan (belum dikonfirmasi/disetujui) |

### 4.2 Admin Pengelola Space

| # | Fitur | Detail |
|---|---|---|
| A1 | Register lokasi | Nama coworking, nama pemilik, telepon, akun admin |
| A2 | Login | Autentikasi JWT, role `admin_space` |
| A3 | Update profil lokasi | Nama, alamat, telepon, deskripsi fasilitas |
| A4 | CRUD member | Tambah/lihat/update/hapus data pelanggan |
| A5 | CRUD space | Nama, tipe, kapasitas, harga/jam, deskripsi, foto |
| A6 | CRUD diskon/promo | Nama, persentase, tanggal awal-akhir berlaku |
| A7 | Kelola reservasi | Konfirmasi, ubah status, check-in, check-out |
| A8 | Lihat semua reservasi | Filter status & bulan |
| A9 | Rekapitulasi pendapatan | Per bulan, per jenis space |

## 5. Alur Bisnis Utama

### 5.1 Alur Reservasi (Member)
1. Member login → browse katalog space → pilih space.
2. Cek ketersediaan (tanggal, jam mulai, durasi).
3. Input kode promo (opsional) → sistem hitung otomatis: `total_harga_awal`, `potongan_diskon`, `total_bayar`.
4. Submit reservasi → status awal `belum_dikonfirm`.
5. Admin konfirmasi → status `disetujui`.
6. Pada hari-H, admin check-in tamu → status `aktif`.
7. Setelah selesai, admin check-out → status `selesai`.
8. Member bisa cetak e-ticket kapan saja setelah reservasi dibuat.

### 5.2 Alur Validasi Promo
1. Member input kode promo saat checkout.
2. Sistem validasi: apakah kode ada, apakah masih dalam rentang `tanggal_awal`–`tanggal_akhir`.
3. Jika valid → hitung potongan = `total_harga_awal x (persentase_diskon / 100)`.
4. Jika tidak valid/kadaluarsa → tampilkan error, reservasi tetap bisa dilanjutkan tanpa promo.

### 5.3 Alur Rekapitulasi Pendapatan
1. Admin pilih filter bulan & tahun.
2. Sistem agregasi seluruh reservasi dengan status `selesai`/`aktif`/`disetujui` pada rentang tersebut.
3. Tampilkan total transaksi, total jam terpakai, estimasi pendapatan kotor, total potongan diskon, realisasi pendapatan bersih, dan rincian per tipe space.

## 6. Model Data (Ringkasan Entitas)

Mengacu pada ERD yang disediakan panitia — boleh disesuaikan tanpa mengurangi fitur:

- **users** — akun login (username, password, role: `admin_space`/`member`)
- **member** — profil member (nama, instansi, alamat, telp, foto)
- **space_owner** — profil admin/pengelola lokasi
- **space** — data ruangan/meja (nama, tipe, kapasitas, harga/jam, deskripsi, foto)
- **diskon** — kode promo (nama, persentase, tanggal awal-akhir)
- **reservasi** — transaksi pemesanan (tanggal, jam mulai, durasi, status, dsb.)
- **detail_reservasi** — relasi reservasi ke space & diskon dengan `total_harga`

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Keamanan** | Password di-hash (bcrypt), JWT untuk autentikasi & otorisasi role-based |
| **Validasi** | Input tervalidasi di sisi backend (class-validator) dan frontend (Zod) |
| **Performa** | Query ketersediaan space harus efisien (index pada `tanggal_reservasi`, `id_space`) |
| **Usability** | UI responsif minimal untuk layar laptop/tablet, mengacu wireframe mobile yang diadaptasi |
| **Auditability** | Setiap perubahan status reservasi tercatat waktunya (`updated_at`, `check_in_time`, `check_out_time`) |
| **Deployability** | Aplikasi berjalan dalam container Docker, dapat di-deploy ke VPS dengan domain & SSL |

## 8. Kriteria Penerimaan (Definition of Done)

- [ ] Seluruh fitur M1–M9 dan A1–A9 berfungsi end-to-end.
- [ ] Autentikasi multi-role (member & admin_space) bekerja dengan JWT.
- [ ] Perhitungan harga & diskon otomatis akurat sesuai skema `total_harga_awal`, `potongan_diskon`, `total_bayar`.
- [ ] E-ticket dengan QR Code dapat digenerate dan ditampilkan/diunduh.
- [ ] Rekapitulasi pendapatan menampilkan data yang benar sesuai filter bulan/tahun.
- [ ] Aplikasi berjalan penuh via `docker compose up` tanpa konfigurasi manual tambahan.
- [ ] Ter-deploy ke VPS dengan domain aktif dan HTTPS.
- [ ] Dokumentasi lengkap: source code, skema database, cara menjalankan aplikasi.

## 9. Timeline Kerja (Estimasi, 21–23 Sept = hari ujian)

| Minggu | Fokus |
|---|---|
| Minggu 1 | Setup project, ERD & migrasi database, modul auth (register/login multi-role) |
| Minggu 2 | Modul space, diskon, reservasi (backend lengkap + frontend member) |
| Minggu 3 | Modul admin (CRUD, check-in/out, laporan), e-ticket & QR Code |
| Minggu 4 (H-3) | Testing end-to-end, dokumentasi, deploy ke VPS + domain, buffer bug fixing |

## 10. Out of Scope (Tidak Dikerjakan)

- Pembayaran online (payment gateway) — sistem hanya mencatat `total_bayar`, tidak ada integrasi pembayaran nyata.
- Notifikasi email/SMS otomatis.
- Multi-bahasa (i18n).
