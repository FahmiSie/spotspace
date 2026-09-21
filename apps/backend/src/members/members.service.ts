import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberAdminDto } from './dto/create-member-admin.dto';
import { UpdateMemberAdminDto } from './dto/update-member-admin.dto';
import { UpdateCoworkingProfileDto } from './dto/update-coworking-profile.dto';
import { GeocodingService } from '../geocoding/geocoding.service';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
  ) {}

  /**
   * Build the Prisma OR condition that scopes members to an admin:
   * - Member was created by this admin (createdByOwnerId === ownerId)
   * - Member has at least 1 reservation at a space owned by this admin
   */
  private scopeCondition(ownerId: number) {
    return [
      { createdByOwnerId: ownerId },
      {
        reservasi: {
          some: {
            detail: {
              space: { ownerId },
            },
          },
        },
      },
    ];
  }

  async findAll(ownerId: number, search?: string) {
    const where: any = {
      OR: this.scopeCondition(ownerId),
    };

    if (search) {
      where.AND = {
        OR: [
          { namaMember: { contains: search, mode: 'insensitive' } },
          { instansi: { contains: search, mode: 'insensitive' } },
          { telp: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.member.findMany({ where });
  }

  async findOne(id: number, ownerId: number) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Member with this ID was not found');

    // Check scope: member must belong to this admin
    const scoped = await this.prisma.member.findFirst({
      where: {
        id,
        OR: this.scopeCondition(ownerId),
      },
    });

    if (!scoped) {
      throw new ForbiddenException('You do not have access to this member');
    }

    return member;
  }

  async create(ownerId: number, dto: CreateMemberAdminDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Username is already taken!');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashed,
        role: 'member',
        member: {
          create: {
            namaMember: dto.nama_member,
            instansi: dto.instansi,
            alamat: dto.alamat,
            telp: dto.telp,
            foto: dto.foto,
            createdByOwnerId: ownerId,
          },
        },
      },
      include: { member: true },
    });

    return user.member;
  }

  async update(id: number, ownerId: number, dto: UpdateMemberAdminDto) {
    // Authorization check — throws 403 if not in scope
    const member = await this.findOne(id, ownerId);

    if (dto.password) {
      const hashed = await bcrypt.hash(dto.password, 10);
      await this.prisma.user.update({ where: { id: member.userId }, data: { password: hashed } });
    }

    return this.prisma.member.update({
      where: { id },
      data: {
        ...(dto.nama_member && { namaMember: dto.nama_member }),
        ...(dto.instansi && { instansi: dto.instansi }),
        ...(dto.alamat && { alamat: dto.alamat }),
        ...(dto.telp && { telp: dto.telp }),
        ...(dto.foto !== undefined && { foto: dto.foto }),
      },
    });
  }

  async remove(id: number, ownerId: number) {
    // Authorization check — throws 403 if not in scope
    const member = await this.findOne(id, ownerId);

    const countReservasi = await this.prisma.reservasi.count({ where: { memberId: id } });
    if (countReservasi > 0) {
      throw new BadRequestException('Cannot delete member with reservation history');
    }

    await this.prisma.member.delete({ where: { id } });
    await this.prisma.user.delete({ where: { id: member.userId } });
    return { id, deleted: true };
  }

  // --- Profil Lokasi Coworking ---
  async getProfile(spaceOwnerId: number) {
    const profile = await this.prisma.spaceOwner.findUnique({
      where: { id: spaceOwnerId },
      include: {
        user: { select: { username: true, email: true } }
      }
    });
    if (!profile) throw new NotFoundException('Coworking profile not found');
    return profile;
  }

  async updateProfile(spaceOwnerId: number, dto: UpdateCoworkingProfileDto) {
    await this.getProfile(spaceOwnerId);

    let latitude = dto.latitude;
    let longitude = dto.longitude;

    if (dto.alamat && latitude === undefined && longitude === undefined) {
      const coords = await this.geocodingService.geocodeAddress(dto.alamat);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }

    return this.prisma.spaceOwner.update({
      where: { id: spaceOwnerId },
      data: {
        namaCoworking: dto.nama_coworking,
        namaPemilik: dto.nama_pemilik,
        telp: dto.telp,
        deskripsi: dto.deskripsi,
        foto: dto.foto,
        ...(dto.alamat !== undefined && { alamat: dto.alamat }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      include: {
        user: { select: { username: true, email: true } }
      }
    });
  }
}