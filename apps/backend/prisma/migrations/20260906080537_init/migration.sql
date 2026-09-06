-- CreateEnum
CREATE TYPE "Role" AS ENUM ('member', 'admin_space');

-- CreateEnum
CREATE TYPE "TipeSpace" AS ENUM ('desk', 'meeting_room', 'private_office');

-- CreateEnum
CREATE TYPE "StatusReservasi" AS ENUM ('belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "namaMember" TEXT NOT NULL,
    "instansi" TEXT,
    "alamat" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "foto" TEXT,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_owner" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "namaCoworking" TEXT NOT NULL,
    "namaPemilik" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "deskripsi" TEXT,

    CONSTRAINT "space_owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space" (
    "id" SERIAL NOT NULL,
    "namaSpace" TEXT NOT NULL,
    "hargaPerJam" DOUBLE PRECISION NOT NULL,
    "tipe" "TipeSpace" NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "deskripsi" TEXT,
    "foto" TEXT,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diskon" (
    "id" SERIAL NOT NULL,
    "namaDiskon" TEXT NOT NULL,
    "persentaseDiskon" DOUBLE PRECISION NOT NULL,
    "tanggalAwal" TIMESTAMP(3) NOT NULL,
    "tanggalAkhir" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diskon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservasi" (
    "id" SERIAL NOT NULL,
    "kodeBooking" TEXT NOT NULL,
    "memberId" INTEGER NOT NULL,
    "tanggalReservasi" DATE NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "durasiJam" INTEGER NOT NULL,
    "status" "StatusReservasi" NOT NULL DEFAULT 'belum_dikonfirm',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_reservasi" (
    "id" SERIAL NOT NULL,
    "reservasiId" INTEGER NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "diskonId" INTEGER,
    "hargaPerJam" DOUBLE PRECISION NOT NULL,
    "totalHargaAwal" DOUBLE PRECISION NOT NULL,
    "potonganDiskon" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBayar" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "detail_reservasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "member_userId_key" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "space_owner_userId_key" ON "space_owner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "diskon_namaDiskon_key" ON "diskon"("namaDiskon");

-- CreateIndex
CREATE UNIQUE INDEX "reservasi_kodeBooking_key" ON "reservasi"("kodeBooking");

-- CreateIndex
CREATE UNIQUE INDEX "detail_reservasi_reservasiId_key" ON "detail_reservasi"("reservasiId");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_owner" ADD CONSTRAINT "space_owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space" ADD CONSTRAINT "space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "space_owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_reservasi" ADD CONSTRAINT "detail_reservasi_reservasiId_fkey" FOREIGN KEY ("reservasiId") REFERENCES "reservasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_reservasi" ADD CONSTRAINT "detail_reservasi_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_reservasi" ADD CONSTRAINT "detail_reservasi_diskonId_fkey" FOREIGN KEY ("diskonId") REFERENCES "diskon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
