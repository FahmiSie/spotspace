import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiskonDto } from './dto/create-diskon.dto';
import { UpdateDiskonDto } from './dto/update-diskon.dto';
import { CheckPromoDto } from './dto/check-promo.dto';
import { NotifikasiService } from '../notifikasi/notifikasi.service';

@Injectable()
export class DiskonService {
  constructor(private prisma: PrismaService, private notifikasiService: NotifikasiService) {}

  /**
   * Helper: dapatkan ownerId dari userId
   */
  private async getOwnerId(userId: number): Promise<number> {
    const owner = await this.prisma.spaceOwner.findUnique({ where: { userId } });
    if (!owner) throw new ForbiddenException('User is not a space owner');
    return owner.id;
  }

  /**
   * Public: ambil semua promo aktif (global saja, atau scoped jika spaceId diketahui)
   */
  async findAllActive() {
    const now = new Date();
    return this.prisma.diskon.findMany({
      where: {
        tanggalAwal: { lte: now },
        tanggalAkhir: { gte: now },
      },
    });
  }

  /**
   * Admin: ambil semua diskon milik admin ini (spaceId milik mereka atau global null)
   */
  async findAll(userId: number) {
    const ownerId = await this.getOwnerId(userId);

    // Get all spaceIds owned by this admin
    const spaces = await this.prisma.space.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const spaceIds = spaces.map((s) => s.id);

    return this.prisma.diskon.findMany({
      where: {
        OR: [
          { spaceId: null }, // Global promos
          { spaceId: { in: spaceIds } }, // Promos scoped to their spaces
        ],
      },
      include: { space: { select: { id: true, namaSpace: true } } },
    });
  }

  async findOne(id: number) {
    const diskon = await this.prisma.diskon.findUnique({ where: { id } });
    if (!diskon) throw new NotFoundException('Diskon dengan ID tersebut tidak ditemukan');
    return diskon;
  }

  /**
   * Public: cek kode promo (dengan optional scoping ke spaceId)
   */
  async checkPromo(dto: CheckPromoDto) {
    const now = new Date();

    const whereClause: any = {
      namaDiskon: dto.nama_diskon,
      tanggalAwal: { lte: now },
      tanggalAkhir: { gte: now },
    };

    // If spaceId provided, scope to that space or global
    if (dto.space_id) {
      whereClause.OR = [
        { spaceId: null },
        { spaceId: dto.space_id },
      ];
    }

    const diskon = await this.prisma.diskon.findFirst({ where: whereClause });

    if (!diskon) {
      throw new BadRequestException('Kode promo tidak ditemukan, sudah kedaluwarsa, atau tidak berlaku untuk lokasi ini!');
    }

    return { ...diskon, is_active: true };
  }

  /**
   * Admin: buat diskon baru. Jika space_id diberikan, validasi kepemilikan.
   */
  async create(userId: number, dto: CreateDiskonDto) {
    const ownerId = await this.getOwnerId(userId);

    const existing = await this.prisma.diskon.findUnique({ where: { namaDiskon: dto.nama_diskon } });
    if (existing) throw new ConflictException('Kode promo sudah digunakan');

    // Validate ownership of the target space if spaceId is provided
    if (dto.space_id) {
      const space = await this.prisma.space.findUnique({ where: { id: dto.space_id } });
      if (!space || space.ownerId !== ownerId) {
        throw new ForbiddenException('Anda tidak memiliki akses ke space ini untuk membuat promo.');
      }
    }

    const diskon = await this.prisma.diskon.create({
      data: {
        namaDiskon: dto.nama_diskon,
        persentaseDiskon: dto.persentase_diskon,
        tanggalAwal: new Date(dto.tanggal_awal),
        tanggalAkhir: new Date(dto.tanggal_akhir),
        spaceId: dto.space_id ?? null,
      },
    });

    // Trigger notifikasi broadcast (Sub-Fase 6)
    await this.notifikasiService.broadcastToAllMembersSafe(
      'promo_baru',
      'Promo Baru Tersedia!',
      `Dapatkan diskon ${diskon.persentaseDiskon}% dengan kode promo ${diskon.namaDiskon}.`,
    );

    return diskon;
  }

  /**
   * Admin: update diskon. Validasi kepemilikan.
   */
  async update(id: number, userId: number, dto: UpdateDiskonDto) {
    const ownerId = await this.getOwnerId(userId);
    const diskon = await this.findOne(id);

    // Validate ownership: diskon must belong to one of admin's spaces or be global
    if (diskon.spaceId !== null) {
      const space = await this.prisma.space.findUnique({ where: { id: diskon.spaceId } });
      if (!space || space.ownerId !== ownerId) {
        throw new ForbiddenException('Anda tidak berhak mengubah promo ini.');
      }
    }

    return this.prisma.diskon.update({
      where: { id },
      data: {
        ...(dto.nama_diskon && { namaDiskon: dto.nama_diskon }),
        ...(dto.persentase_diskon !== undefined && { persentaseDiskon: dto.persentase_diskon }),
        ...(dto.tanggal_awal && { tanggalAwal: new Date(dto.tanggal_awal) }),
        ...(dto.tanggal_akhir && { tanggalAkhir: new Date(dto.tanggal_akhir) }),
      },
    });
  }

  /**
   * Admin: hapus diskon. Validasi kepemilikan.
   */
  async remove(id: number, userId: number) {
    const ownerId = await this.getOwnerId(userId);
    const diskon = await this.findOne(id);

    // Validate ownership
    if (diskon.spaceId !== null) {
      const space = await this.prisma.space.findUnique({ where: { id: diskon.spaceId } });
      if (!space || space.ownerId !== ownerId) {
        throw new ForbiddenException('Anda tidak berhak menghapus promo ini.');
      }
    }

    const countPemakaian = await this.prisma.detailReservasi.count({ where: { diskonId: id } });
    if (countPemakaian > 0) {
      throw new BadRequestException('Diskon tidak dapat dihapus karena pernah digunakan dalam reservasi');
    }

    await this.prisma.diskon.delete({ where: { id } });
    return { id, deleted: true };
  }
}