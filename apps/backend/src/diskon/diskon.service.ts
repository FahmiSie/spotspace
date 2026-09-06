import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiskonDto } from './dto/create-diskon.dto';
import { UpdateDiskonDto } from './dto/update-diskon.dto';
import { CheckPromoDto } from './dto/check-promo.dto';

@Injectable()
export class DiskonService {
  constructor(private prisma: PrismaService) {}

  async findAllActive() {
    const now = new Date();
    return this.prisma.diskon.findMany({
      where: {
        tanggalAwal: { lte: now },
        tanggalAkhir: { gte: now },
      },
    });
  }

  async findAll() {
    return this.prisma.diskon.findMany();
  }

  async findOne(id: number) {
    const diskon = await this.prisma.diskon.findUnique({ where: { id } });
    if (!diskon) throw new NotFoundException('Diskon dengan ID tersebut tidak ditemukan');
    return diskon;
  }

  async checkPromo(dto: CheckPromoDto) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { namaDiskon: dto.nama_diskon },
    });

    if (!diskon) {
      throw new BadRequestException('Kode promo tidak ditemukan atau sudah kedaluwarsa!');
    }

    const now = new Date();
    const isActive = diskon.tanggalAwal <= now && diskon.tanggalAkhir >= now;

    if (!isActive) {
      throw new BadRequestException('Kode promo tidak ditemukan atau sudah kedaluwarsa!');
    }

    return { ...diskon, is_active: isActive };
  }

  async create(dto: CreateDiskonDto) {
    const existing = await this.prisma.diskon.findUnique({ where: { namaDiskon: dto.nama_diskon } });
    if (existing) throw new ConflictException('Kode promo sudah digunakan');

    return this.prisma.diskon.create({
      data: {
        namaDiskon: dto.nama_diskon,
        persentaseDiskon: dto.persentase_diskon,
        tanggalAwal: new Date(dto.tanggal_awal),
        tanggalAkhir: new Date(dto.tanggal_akhir),
      },
    });
  }

  async update(id: number, dto: UpdateDiskonDto) {
    await this.findOne(id);
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

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.diskon.delete({ where: { id } });
    return { id, deleted: true };
  }
}