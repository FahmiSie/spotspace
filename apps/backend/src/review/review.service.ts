import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  private async getMemberId(userId: number): Promise<number> {
    const member = await this.prisma.member.findUnique({
      where: { userId },
    });
    if (!member) {
      throw new ForbiddenException('User is not a member');
    }
    return member.id;
  }

  async createReview(userId: number, dto: CreateReviewDto) {
    const memberId = await this.getMemberId(userId);

    const reservasi = await this.prisma.reservasi.findUnique({
      where: { id: dto.reservasiId },
    });

    if (!reservasi) {
      throw new NotFoundException('Reservasi not found');
    }

    if (reservasi.memberId !== memberId) {
      throw new ForbiddenException('Invalid reservation ownership');
    }

    // Only allow if status is 'selesai'
    if (reservasi.status !== 'selesai') {
      throw new BadRequestException('You can only review completed reservations');
    }

    // Let's get detail to check spaceId
    const detail = await this.prisma.detailReservasi.findUnique({
      where: { reservasiId: reservasi.id }
    });
    if (!detail || detail.spaceId !== dto.spaceId) {
      throw new BadRequestException('Reservation does not match the provided space');
    }

    // Check if review already exists for this reservation
    const existing = await this.prisma.review.findUnique({
      where: { reservasiId: dto.reservasiId },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this booking');
    }

    const review = await this.prisma.review.create({
      data: {
        spaceId: dto.spaceId,
        memberId: memberId,
        reservasiId: dto.reservasiId,
        rating: dto.rating,
        komentar: dto.komentar,
      },
    });

    return review;
  }

  async getReviewsBySpace(spaceId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { spaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: {
            namaMember: true,
            foto: true,
            instansi: true,
          }
        }
      }
    });

    const totalReviews = reviews.length;
    const sumRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    
    // Division by Zero Safe-check
    const averageRating = totalReviews === 0 ? 0 : Number((sumRating / totalReviews).toFixed(1));

    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return {
      reviews,
      stats: {
        totalReviews,
        averageRating,
        distribution
      }
    };
  }

  async checkReviewEligibility(userId: number, spaceId: number) {
    let memberId: number;
    try {
      memberId = await this.getMemberId(userId);
    } catch {
      return { canReview: false };
    }

    // Find a completed reservation for this space that doesn't have a review yet
    const eligibleReservasi = await this.prisma.reservasi.findFirst({
      where: {
        memberId,
        status: 'selesai',
        detail: {
          spaceId
        },
        review: null // Not reviewed yet
      },
      select: {
        id: true
      }
    });

    if (eligibleReservasi) {
      return {
        canReview: true,
        eligibleReservasiId: eligibleReservasi.id
      };
    }

    return { canReview: false };
  }

  async getAdminReviews(userId: number) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { userId },
    });

    if (!owner) {
      throw new ForbiddenException('User is not a space owner');
    }

    const spaces = await this.prisma.space.findMany({
      where: { ownerId: owner.id },
      include: {
        reviews: {
          include: {
            member: {
              select: {
                namaMember: true,
                foto: true,
                instansi: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    let allReviews: any[] = [];
    spaces.forEach(space => {
      space.reviews.forEach(review => {
        allReviews.push({
          ...review,
          space: {
            id: space.id,
            nama_space: space.namaSpace || (space as any).nama_space,
          }
        });
      });
    });

    allReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalReviews = allReviews.length;
    const sumRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const globalAverageRating = totalReviews === 0 ? 0 : Number((sumRating / totalReviews).toFixed(1));

    let topRatedSpace: any = null;
    let mostReviewedSpace: any = null;

    if (spaces.length > 0) {
      const spaceStats = spaces.map(space => {
        const spaceTotalReviews = space.reviews.length;
        const spaceSumRating = space.reviews.reduce((acc, curr) => acc + curr.rating, 0);
        const spaceAverageRating = spaceTotalReviews === 0 ? 0 : Number((spaceSumRating / spaceTotalReviews).toFixed(1));
        
        return {
          id: space.id,
          nama: space.namaSpace || (space as any).nama_space,
          totalReviews: spaceTotalReviews,
          averageRating: spaceAverageRating,
        };
      });

      const spacesWithReviews = spaceStats.filter(s => s.totalReviews > 0);

      if (spacesWithReviews.length > 0) {
        topRatedSpace = spacesWithReviews.reduce((prev, current) => 
          (prev.averageRating > current.averageRating) ? prev : current
        );
        
        mostReviewedSpace = spacesWithReviews.reduce((prev, current) => 
          (prev.totalReviews > current.totalReviews) ? prev : current
        );
      }
    }

    return {
      reviews: allReviews,
      metrics: {
        totalReviews,
        globalAverageRating,
        topRatedSpace,
        mostReviewedSpace
      }
    };
  }
}
