import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipeNotifikasi } from '@prisma/client';

@Injectable()
export class NotifikasiService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: number) {
    const list = await this.prisma.notifikasi.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((n) => ({
      id: n.id,
      tipe: n.tipe,
      judul: n.judul,
      pesan: n.pesan,
      is_read: n.isRead,
      created_at: n.createdAt,
    }));
  }

  async markAsRead(id: number, userId: number) {
    const notifikasi = await this.prisma.notifikasi.findFirst({
      where: { id, userId },
    });
    if (!notifikasi) return { message: 'Notifikasi tidak ditemukan' };

    await this.prisma.notifikasi.update({
      where: { id },
      data: { isRead: true },
    });
    return { id, is_read: true };
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notifikasi.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated_count: result.count };
  }

  /**
   * Helper: buat satu notifikasi. Digunakan oleh service lain via side-effect.
   * Didesain agar TIDAK melempar exception — hanya log error.
   */
  async createSafe(userId: number, tipe: TipeNotifikasi, judul: string, pesan: string) {
    try {
      await this.prisma.notifikasi.create({
        data: { userId, tipe, judul, pesan },
      });
    } catch (err) {
      console.error('Gagal membuat notifikasi:', err);
    }
  }

  /**
   * Helper: broadcast notifikasi ke SEMUA member. Gunakan createMany untuk efisiensi.
   * Didesain agar TIDAK melempar exception — hanya log error.
   */
  async broadcastToAllMembersSafe(tipe: TipeNotifikasi, judul: string, pesan: string) {
    try {
      const members = await this.prisma.member.findMany({
        select: { userId: true },
      });

      if (members.length === 0) return;

      await this.prisma.notifikasi.createMany({
        data: members.map((m) => ({
          userId: m.userId,
          tipe,
          judul,
          pesan,
        })),
      });
    } catch (err) {
      console.error('Gagal broadcast notifikasi ke semua member:', err);
    }
  }
}
