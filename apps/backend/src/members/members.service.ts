import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberAdminDto } from './dto/create-member-admin.dto';
import { UpdateMemberAdminDto } from './dto/update-member-admin.dto';
import { UpdateCoworkingProfileDto } from './dto/update-coworking-profile.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.member.findMany({
      where: search
        ? {
            OR: [
              { namaMember: { contains: search, mode: 'insensitive' } },
              { instansi: { contains: search, mode: 'insensitive' } },
              { telp: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
  }

  async findOne(id: number) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Member dengan ID tersebut tidak ditemukan');
    return member;
  }

  async create(dto: CreateMemberAdminDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Username sudah digunakan oleh akun lain!');

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
          },
        },
      },
      include: { member: true },
    });

    return user.member;
  }

  async update(id: number, dto: UpdateMemberAdminDto) {
    const member = await this.findOne(id);

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

  async remove(id: number) {
    const member = await this.findOne(id);
    await this.prisma.member.delete({ where: { id } });
    await this.prisma.user.delete({ where: { id: member.userId } });
    return { id, deleted: true };
  }

  // --- Profil Lokasi Coworking ---
  async getProfile(spaceOwnerId: number) {
    const profile = await this.prisma.spaceOwner.findUnique({ where: { id: spaceOwnerId } });
    if (!profile) throw new NotFoundException('Profil coworking tidak ditemukan');
    return profile;
  }

  async updateProfile(spaceOwnerId: number, dto: UpdateCoworkingProfileDto) {
    await this.getProfile(spaceOwnerId);
    return this.prisma.spaceOwner.update({
      where: { id: spaceOwnerId },
      data: {
        namaCoworking: dto.nama_coworking,
        namaPemilik: dto.nama_pemilik,
        telp: dto.telp,
        deskripsi: dto.deskripsi,
      },
    });
  }
}