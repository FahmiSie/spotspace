import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { hitungJamSelesai, isOverlap } from '../common/utils/time.util';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  getTypes() {
    return [
      { tipe: 'desk', label: 'Personal Desk', deskripsi: 'Meja kerja individual dengan colokan listrik dan WiFi kencang.' },
      { tipe: 'meeting_room', label: 'Meeting Room', deskripsi: 'Ruang rapat tertutup dengan proyektor/TV, whiteboard, dan AC.' },
      { tipe: 'private_office', label: 'Private Office', deskripsi: 'Ruang kantor privat untuk tim kecil hingga menengah.' },
    ];
  }

  async findAll(tipe?: string, search?: string) {
    return this.prisma.space.findMany({
      where: {
        ...(tipe ? { tipe: tipe as any } : {}),
        ...(search ? { namaSpace: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { owner: true },
    });
  }

  async findOne(id: number) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!space) throw new NotFoundException('Space dengan ID tersebut tidak ditemukan');
    return space;
  }

  async create(ownerId: number, dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: {
        namaSpace: dto.nama_space,
        hargaPerJam: dto.harga_per_jam,
        tipe: dto.tipe,
        kapasitas: dto.kapasitas,
        deskripsi: dto.deskripsi,
        foto: dto.foto,
        ownerId,
      },
    });
  }

  async update(id: number, dto: UpdateSpaceDto) {
    await this.findOne(id);
    return this.prisma.space.update({
      where: { id },
      data: {
        ...(dto.nama_space && { namaSpace: dto.nama_space }),
        ...(dto.harga_per_jam !== undefined && { hargaPerJam: dto.harga_per_jam }),
        ...(dto.tipe && { tipe: dto.tipe }),
        ...(dto.kapasitas !== undefined && { kapasitas: dto.kapasitas }),
        ...(dto.deskripsi !== undefined && { deskripsi: dto.deskripsi }),
        ...(dto.foto !== undefined && { foto: dto.foto }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.space.delete({ where: { id } });
    return { id, deleted: true };
  }

  async findAllByOwner(ownerId: number) {
    return this.prisma.space.findMany({ where: { ownerId } });
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const space = await this.findOne(dto.id_space);
    const jamSelesai = hitungJamSelesai(dto.jam_mulai, dto.durasi_jam);
    const tanggal = new Date(dto.tanggal);

    // Ambil semua reservasi aktif (bukan dibatalkan) di space & tanggal yang sama
    const existingReservasi = await this.prisma.reservasi.findMany({
      where: {
        status: { not: 'dibatalkan' },
        tanggalReservasi: tanggal,
        detail: { spaceId: dto.id_space },
      },
    });

    const bentrok = existingReservasi.some((r) =>
      isOverlap(dto.jam_mulai, jamSelesai, r.jamMulai, r.jamSelesai),
    );

    if (bentrok) {
      throw new BadRequestException('Maaf, space sudah terisi atau dibooking pada jam tersebut!');
    }

    const estimasiTotal = space.hargaPerJam * dto.durasi_jam;

    return {
      available: true,
      id_space: space.id,
      nama_space: space.namaSpace,
      tanggal: dto.tanggal,
      jam_mulai: dto.jam_mulai,
      jam_selesai: jamSelesai,
      durasi_jam: dto.durasi_jam,
      harga_per_jam: space.hargaPerJam,
      estimasi_total: estimasiTotal,
    };
  }
}