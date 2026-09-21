import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservasiDto } from './dto/create-reservasi.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { hitungJamSelesai, isOverlap, generateKodeBooking } from '../common/utils/time.util';
import * as QRCode from 'qrcode';
import { Diskon } from '@prisma/client';
import { AdminReservasiQueryDto } from './dto/admin-query.dto';
import { NotifikasiService } from '../notifikasi/notifikasi.service';

@Injectable()
export class ReservasiService {
  private readonly logger = new Logger(ReservasiService.name);

  constructor(private prisma: PrismaService, private notifikasiService: NotifikasiService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleAutoCheckout() {
    this.logger.log('Running auto check-out cron job...');
    const now = new Date();
    
    // Find all 'berjalan' (aktif) reservations
    const activeReservations = await this.prisma.reservasi.findMany({
      where: { status: 'aktif' },
    });

    let count = 0;
    for (const r of activeReservations) {
      // Parse jamSelesai, e.g. "12:00"
      const [hours, minutes] = r.jamSelesai.split(':').map(Number);
      
      // We must compare with the exact date of the reservation
      // Since tanggalReservasi is stored as Date, we combine it with jamSelesai
      const endDateTime = new Date(r.tanggalReservasi);
      endDateTime.setHours(hours, minutes, 0, 0);

      // If current time has passed the endDateTime, auto checkout
      if (now > endDateTime) {
        await this.prisma.reservasi.update({
          where: { id: r.id },
          data: { 
            status: 'selesai',
            checkOutTime: endDateTime // Use the actual end time, or 'now'
          }
        });
        count++;
      }
    }
    
    if (count > 0) {
      this.logger.log(`Auto checked-out ${count} reservations.`);
    }
  }

  async create(memberId: number, dto: CreateReservasiDto) {
    const space = await this.prisma.space.findUnique({ where: { id: dto.id_space }, include: { owner: true } });
    if (!space) throw new NotFoundException('Space tidak ditemukan');

    const jamSelesai = hitungJamSelesai(dto.jam_mulai, dto.durasi_jam);
    const tanggal = new Date(dto.tanggal_reservasi);

    const tanggalStr = dto.tanggal_reservasi.split('T')[0];
    const waktuMulaiReservasi = new Date(`${tanggalStr}T${dto.jam_mulai}:00`);
    const waktuSekarang = new Date();

    if (waktuMulaiReservasi <= waktuSekarang) {
      throw new BadRequestException('Waktu mulai reservasi tidak boleh di masa lalu.');
    }

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Cek overlap berdasarkan kapasitas (aturan bisnis #1)
    const existingReservasi = await this.prisma.reservasi.findMany({
      where: {
        status: { not: 'dibatalkan' },
        tanggalReservasi: tanggal,
        detail: { spaceId: dto.id_space },
        NOT: {
          status: 'belum_dikonfirm',
          createdAt: { lt: fifteenMinsAgo },
        },
      },
    });

    const overlappingBookings = existingReservasi.filter((r) =>
      isOverlap(dto.jam_mulai, jamSelesai, r.jamMulai, r.jamSelesai)
    );

    const maxAllowed = space.tipe === 'desk' ? space.kapasitas : 1;

    if (overlappingBookings.length >= maxAllowed) {
      const pesan = space.tipe === 'desk'
        ? `Kapasitas meja telah penuh untuk jam tersebut (Maks: ${space.kapasitas} orang).`
        : `Ruangan ${space.tipe.replace('_', ' ')} sudah dipesan oleh pengguna lain pada jadwal tersebut.`;
      throw new BadRequestException(pesan);
    }

    // Validasi promo (opsional) — aturan bisnis #4
    let diskon: Diskon | null = null;
    const kodePromo = dto.kode_promo;
    const now = new Date();

    if (dto.id_diskon) {
      diskon = await this.prisma.diskon.findUnique({ where: { id: dto.id_diskon } });
    } else if (kodePromo) {
      diskon = await this.prisma.diskon.findFirst({
        where: {
          namaDiskon: kodePromo,
          tanggalAwal: { lte: now },
          tanggalAkhir: { gte: now },
          OR: [
            { spaceId: null },
            { spaceId: Number(dto.id_space) },
          ],
        },
      });

      if (!diskon) {
        throw new BadRequestException('Kode promo tidak valid, kedaluwarsa, atau tidak berlaku untuk lokasi ini.');
      }
    }

    if (diskon) {
      const valid = diskon.tanggalAwal <= now && diskon.tanggalAkhir >= now;
      if (!valid) {
        throw new BadRequestException('Kode promo telah kedaluwarsa atau belum aktif');
      }
    }

    // Perhitungan harga (aturan bisnis #3)
    const totalHargaAwal = space.hargaPerJam * dto.durasi_jam;
    const potonganDiskon = diskon ? totalHargaAwal * (diskon.persentaseDiskon / 100) : 0;
    const totalBayar = totalHargaAwal - potonganDiskon;

    // Transaksi: buat reservasi + detail sekaligus, generate kode booking dari id yang baru dibuat
    const result = await this.prisma.$transaction(async (tx) => {
      const reservasi = await tx.reservasi.create({
        data: {
          kodeBooking: 'TEMP', // placeholder, di-update setelah tahu id
          memberId,
          tanggalReservasi: tanggal,
          jamMulai: dto.jam_mulai,
          jamSelesai,
          durasiJam: dto.durasi_jam,
          status: 'belum_dikonfirm',
        },
      });

      const kodeBooking = generateKodeBooking(tanggal, reservasi.id);

      const updated = await tx.reservasi.update({
        where: { id: reservasi.id },
        data: { kodeBooking },
      });

      const detail = await tx.detailReservasi.create({
        data: {
          reservasiId: reservasi.id,
          spaceId: dto.id_space,
          diskonId: diskon?.id ?? null,
          hargaPerJam: space.hargaPerJam,
          totalHargaAwal,
          potonganDiskon,
          totalBayar,
        },
      });

      return { ...updated, detail };
    });

    const response = {
      id: result.id,
      kode_booking: result.kodeBooking,
      id_member: memberId,
      id_space: dto.id_space,
      id_diskon: diskon?.id ?? null,
      tanggal_reservasi: dto.tanggal_reservasi,
      jam_mulai: dto.jam_mulai,
      jam_selesai: jamSelesai,
      durasi_jam: dto.durasi_jam,
      harga_per_jam: space.hargaPerJam,
      total_harga_awal: totalHargaAwal,
      potongan_diskon: potonganDiskon,
      total_bayar: totalBayar,
      status: 'belum_dikonfirm',
    };

    // Trigger notifikasi (Sub-Fase 6)
    // Send to admin_space (space.owner.userId)
    await this.notifikasiService.createSafe(
      space.owner.userId,
      'reservasi_dibuat',
      'Reservasi Baru Dibuat',
      `Reservasi baru dengan kode ${result.kodeBooking} telah dibuat.`,
    );

    return response;
  }

  async findMy(memberId: number) {
    const list = await this.prisma.reservasi.findMany({
      where: { memberId },
      include: { 
        detail: { include: { space: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((r) => ({
      id: r.id,
      kode_booking: r.kodeBooking,
      tanggal_reservasi: r.tanggalReservasi,
      jam_mulai: r.jamMulai,
      jam_selesai: r.jamSelesai,
      durasi_jam: r.durasiJam,
      total_bayar: r.detail?.totalBayar,
      status: r.status,
      alasanPenolakan: r.alasanPenolakan,
      payment: r.payment ? { status: r.payment.status } : null,
      space: r.detail?.space
        ? { id: r.detail.space.id, nama_space: r.detail.space.namaSpace, tipe: r.detail.space.tipe }
        : null,
    }));
  }

  async findHistory(memberId: number, query: HistoryQueryDto) {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const list = await this.prisma.reservasi.findMany({
      where: {
        memberId,
        tanggalReservasi: { gte: start, lt: end },
      },
      include: { detail: { include: { space: true } } },
    });

    const totalPengeluaran = list.reduce((sum, r) => sum + (r.detail?.totalBayar ?? 0), 0);

    return {
      month,
      year,
      total_reservasi: list.length,
      total_pengeluaran: totalPengeluaran,
      items: list.map((r) => ({
        id: r.id,
        kode_booking: r.kodeBooking,
        tanggal_reservasi: r.tanggalReservasi,
        jam_mulai: r.jamMulai,
        jam_selesai: r.jamSelesai,
        durasi_jam: r.durasiJam,
        total_bayar: r.detail?.totalBayar,
        status: r.status,
        alasanPenolakan: r.alasanPenolakan,
        space_name: r.detail?.space?.namaSpace,
      })),
    };
  }

  private async findOneRaw(id: number) {
    const r = await this.prisma.reservasi.findUnique({
      where: { id },
      include: {
        member: true,
        detail: { include: { space: { include: { owner: true } }, diskon: true } },
        payment: true,
      },
    });
    if (!r) throw new NotFoundException('Reservasi dengan ID tersebut tidak ditemukan');
    return r;
  }

  async findOne(id: number, requester: { role: string; memberId: number | null }) {
    const r = await this.findOneRaw(id);
    if (requester.role === 'member' && r.memberId !== requester.memberId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke reservasi ini');
    }
    return {
      id: r.id,
      kode_booking: r.kodeBooking,
      id_member: r.memberId,
      id_space: r.detail?.spaceId,
      tanggal_reservasi: r.tanggalReservasi,
      jam_mulai: r.jamMulai,
      jam_selesai: r.jamSelesai,
      durasi_jam: r.durasiJam,
      total_bayar: r.detail?.totalBayar,
      status: r.status,
      alasanPenolakan: r.alasanPenolakan,
      member: { nama_member: r.member.namaMember, telp: r.member.telp },
      space: { nama_space: r.detail?.space.namaSpace, harga_per_jam: r.detail?.space.hargaPerJam },
    };
  }

  async cancel(id: number, memberId: number) {
    const r = await this.findOneRaw(id);
    if (r.memberId !== memberId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk membatalkan reservasi ini');
    }
    if (!['belum_dikonfirm', 'disetujui'].includes(r.status)) {
      throw new BadRequestException('Reservasi ini tidak bisa dibatalkan pada status saat ini');
    }
    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: 'dibatalkan' },
    });
    return { id: updated.id, status: updated.status, updated_at: updated.updatedAt };
  }

  async getETicket(id: number, requester: { role: string; memberId: number | null }) {
    const r = await this.findOneRaw(id);
    if (requester.role === 'member' && r.memberId !== requester.memberId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke e-ticket ini');
    }

    const qrPayload = r.kodeBooking;
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

    return {
      e_ticket_number: `TICKET-${r.detail?.space.owner.namaCoworking.replace(/\s+/g, '').toUpperCase()}-${r.kodeBooking.replace('BOOK-', '')}`,
      kode_booking: r.kodeBooking,
      coworking_space: {
        nama: r.detail?.space.owner.namaCoworking,
        telepon: r.detail?.space.owner.telp,
      },
      member: {
        nama: r.member.namaMember,
        instansi: r.member.instansi,
        telp: r.member.telp,
      },
      space: {
        nama: r.detail?.space.namaSpace,
        tipe: r.detail?.space.tipe,
        harga_per_jam: r.detail?.space.hargaPerJam,
      },
      jadwal: {
        tanggal: r.tanggalReservasi,
        jam_mulai: r.jamMulai,
        jam_selesai: r.jamSelesai,
        durasi: `${r.durasiJam} Jam`,
      },
      rincian_pembayaran: {
        tarif_kotor: r.detail?.totalHargaAwal,
        diskon_promo: r.detail?.diskon
          ? `${r.detail.diskon.persentaseDiskon}% (${r.detail.diskon.namaDiskon})`
          : null,
        potongan: r.detail?.potonganDiskon,
        total_dibayar: r.detail?.totalBayar,
      },
      status_reservasi: r.status,
      qr_code: qrCodeDataUrl,
    };
  }
  async findAllForAdmin(spaceOwnerId: number, query: AdminReservasiQueryDto) {
  const where: any = {
    detail: { space: { ownerId: spaceOwnerId } },
  };

  if (query.status) where.status = query.status;
  if (query.id_space) where.detail = { ...where.detail, spaceId: query.id_space };
  if (query.tanggal) {
    where.tanggalReservasi = new Date(query.tanggal);
  } else if (query.month || query.year) {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();
    where.tanggalReservasi = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  const list = await this.prisma.reservasi.findMany({
    where,
    include: { member: true, payment: true, detail: { include: { space: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return list.map((r) => ({
    id: r.id,
    kode_booking: r.kodeBooking,
    tanggal_reservasi: r.tanggalReservasi,
    jam_mulai: r.jamMulai,
    jam_selesai: r.jamSelesai,
    durasi_jam: r.durasiJam,
    total_harga_awal: r.detail?.totalHargaAwal,
    potongan_diskon: r.detail?.potonganDiskon,
    total_bayar: r.detail?.totalBayar,
    status: r.status,
    alasanPenolakan: r.alasanPenolakan,
    payment: r.payment ? { status: r.payment.status } : null,
    member: { id: r.member.id, nama_member: r.member.namaMember, telp: r.member.telp },
    space: r.detail?.space
      ? { id: r.detail.space.id, nama_space: r.detail.space.namaSpace, tipe: r.detail.space.tipe }
      : null,
  }));
}

async updateStatus(id: number, spaceOwnerId: number, status: string, alasanPenolakan?: string) {
  const r = await this.findOneRaw(id);
  this.assertOwnership(r, spaceOwnerId);

  const transisiValid: Record<string, string[]> = {
    belum_dikonfirm: ['disetujui', 'dibatalkan'],
    disetujui: ['dibatalkan'],
  };
  if (!transisiValid[r.status]?.includes(status)) {
    throw new BadRequestException(`Tidak bisa mengubah status dari ${r.status} ke ${status}`);
  }

  if (status === 'disetujui') {
    if (!r.payment || r.payment.status !== 'paid') {
      throw new BadRequestException('Reservasi belum dibayar, tidak bisa dikonfirmasi');
    }
  }

  if (status === 'dibatalkan') {
    if (r.payment && r.payment.status === 'paid') {
      await this.prisma.payment.update({
        where: { id: r.payment.id },
        data: {
          status: 'refunded',
          updatedAt: new Date(),
        },
      });
    }
  }

  const updated = await this.prisma.reservasi.update({
    where: { id },
    data: { 
      status: status as any,
      ...(alasanPenolakan && status === 'dibatalkan' ? { alasanPenolakan } : {})
    },
  });

  // Trigger notifikasi (Sub-Fase 6)
  if (status === 'disetujui') {
    await this.notifikasiService.createSafe(
      r.member.userId,
      'reservasi_dikonfirmasi',
      'Reservasi Dikonfirmasi',
      `Reservasi Anda dengan kode ${r.kodeBooking} telah disetujui.`,
    );
  } else if (status === 'dibatalkan') {
    await this.notifikasiService.createSafe(
      r.member.userId,
      'reservasi_dibatalkan',
      'Reservasi Dibatalkan',
      `Reservasi Anda dengan kode ${r.kodeBooking} telah dibatalkan.`,
    );
  }

  return { id: updated.id, status: updated.status, updated_at: updated.updatedAt };
}

async checkIn(id: number, spaceOwnerId: number) {
  const r = await this.findOneRaw(id);
  this.assertOwnership(r, spaceOwnerId);

  if (r.status !== 'disetujui') {
    throw new BadRequestException('Reservasi harus berstatus "disetujui" sebelum check-in');
  }

  const updated = await this.prisma.reservasi.update({
    where: { id },
    data: { status: 'aktif', checkInTime: new Date() },
  });

  // Trigger notifikasi (Sub-Fase 6)
  await this.notifikasiService.createSafe(
    r.member.userId,
    'check_in',
    'Check-in Berhasil',
    `Anda telah berhasil check-in untuk reservasi ${r.kodeBooking}.`,
  );

  return { id: updated.id, status: updated.status, check_in_time: updated.checkInTime };
}

async checkOut(id: number, spaceOwnerId: number) {
  const r = await this.findOneRaw(id);
  this.assertOwnership(r, spaceOwnerId);

  if (r.status !== 'aktif') {
    throw new BadRequestException('Reservasi harus berstatus "aktif" sebelum check-out');
  }

  const updated = await this.prisma.reservasi.update({
    where: { id },
    data: { status: 'selesai', checkOutTime: new Date() },
  });

  // Trigger notifikasi (Sub-Fase 6)
  await this.notifikasiService.createSafe(
    r.member.userId,
    'check_out',
    'Check-out Berhasil',
    `Anda telah berhasil check-out untuk reservasi ${r.kodeBooking}. Terima kasih!`,
  );

  return { id: updated.id, status: updated.status, check_out_time: updated.checkOutTime };
}

async processQrScan(code: string, spaceOwnerId: number) {
  const cleanCode = code.trim();
  const reservasi = await this.prisma.reservasi.findFirst({
    where: {
      OR: [
        { kodeBooking: cleanCode },
        { id: isNaN(Number(cleanCode)) ? undefined : Number(cleanCode) }
      ]
    },
    include: {
      member: true,
      detail: { include: { space: true } }
    }
  });

  if (!reservasi) {
    throw new NotFoundException('Tiket reservasi tidak valid atau tidak ditemukan.');
  }

  this.assertOwnership(reservasi, spaceOwnerId);

  if (reservasi.status === 'disetujui') {
    const res = await this.checkIn(reservasi.id, spaceOwnerId);
    return {
      action: 'check_in',
      message: `Check-in berhasil! Selamat datang, ${reservasi.member?.namaMember || 'Member'}.`,
      data: res
    };
  }

  if (reservasi.status === 'aktif') {
    const res = await this.checkOut(reservasi.id, spaceOwnerId);
    return {
      action: 'check_out',
      message: `Check-out berhasil! Sesi sewa ${reservasi.detail?.space?.namaSpace} telah selesai.`,
      data: res
    };
  }

  if (reservasi.status === 'belum_dikonfirm') {
    throw new BadRequestException('Pemesanan ini belum disetujui oleh admin.');
  }
  if (reservasi.status === 'selesai') {
    throw new BadRequestException('Tiket reservasi ini sudah selesai digunakan.');
  }
  if (reservasi.status === 'dibatalkan') {
    throw new BadRequestException('Tiket reservasi ini telah dibatalkan.');
  }

  throw new BadRequestException(`Status reservasi (${reservasi.status}) tidak valid untuk scan.`);
}

private assertOwnership(r: any, spaceOwnerId: number) {
  if (r.detail?.space?.ownerId !== spaceOwnerId) {
    throw new ForbiddenException('Anda tidak memiliki akses ke reservasi ini');
  }
}
}