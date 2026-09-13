import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(memberId: number, dto: CreateReviewDto) {
    // Validasi: member harus pernah pesan space ini dengan status 'selesai'
    const reservasiSelesai = await this.prisma.reservasi.findFirst({
      where: {
        memberId,
        status: 'selesai',
        detail: { spaceId: dto.id_space },
      },
    });

    if (!reservasiSelesai) {
      throw new BadRequestException(
        'Anda hanya bisa memberikan review pada space yang pernah Anda pesan dan sudah selesai.',
      );
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          spaceId: dto.id_space,
          memberId,
          rating: dto.rating,
          komentar: dto.komentar,
          ...(dto.foto_urls?.length
            ? {
                fotoReview: {
                  createMany: {
                    data: dto.foto_urls.map((url) => ({ url })),
                  },
                },
              }
            : {}),
        },
        include: { fotoReview: true },
      });

      return {
        id: review.id,
        id_space: review.spaceId,
        id_member: review.memberId,
        rating: review.rating,
        komentar: review.komentar,
        foto_urls: review.fotoReview.map((f) => f.url),
        created_at: review.createdAt,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          'Anda sudah pernah memberikan review untuk space ini. Satu member hanya bisa review 1x per space.',
        );
      }
      throw err;
    }
  }

  async findBySpace(spaceId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { spaceId },
      include: {
        member: { select: { namaMember: true } },
        fotoReview: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      komentar: r.komentar,
      nama_member: r.member.namaMember,
      foto_urls: r.fotoReview.map((f) => f.url),
      created_at: r.createdAt,
    }));
  }
}
