import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async toggle(memberId: number, spaceId: number) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { memberId_spaceId: { memberId, spaceId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { id_space: spaceId, status: 'removed' };
    }

    await this.prisma.wishlist.create({
      data: { memberId, spaceId },
    });
    return { id_space: spaceId, status: 'added' };
  }

  async findMy(memberId: number) {
    const list = await this.prisma.wishlist.findMany({
      where: { memberId },
      include: {
        space: {
          include: { owner: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((w) => ({
      id: w.id,
      id_space: w.spaceId,
      created_at: w.createdAt,
      space: {
        id: w.space.id,
        nama_space: w.space.namaSpace,
        harga_per_jam: w.space.hargaPerJam,
        tipe: w.space.tipe,
        kapasitas: w.space.kapasitas,
        deskripsi: w.space.deskripsi,
        foto: w.space.foto,
        owner: {
          nama_coworking: w.space.owner.namaCoworking,
        },
      },
    }));
  }
}
