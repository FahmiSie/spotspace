import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

  async findAll(
    tipe?: string,
    search?: string,
    filters?: { minHarga?: number; maxHarga?: number; minKapasitas?: number },
  ) {
    const where: any = {};

    if (tipe) where.tipe = tipe as any;
    if (search) where.namaSpace = { contains: search, mode: 'insensitive' };

    if (filters?.minHarga !== undefined || filters?.maxHarga !== undefined) {
      where.hargaPerJam = {};
      if (filters.minHarga !== undefined) where.hargaPerJam.gte = filters.minHarga;
      if (filters.maxHarga !== undefined) where.hargaPerJam.lte = filters.maxHarga;
    }

    if (filters?.minKapasitas !== undefined) {
      where.kapasitas = { gte: filters.minKapasitas };
    }

    return this.prisma.space.findMany({
      where,
      include: { owner: true },
    });
  }

  async findOne(id: number) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        owner: true,
        fotoGaleri: { orderBy: { urutan: 'asc' } },
      },
    });
    if (!space) throw new NotFoundException('Space dengan ID tersebut tidak ditemukan');

    const reviewAgg = await this.prisma.review.aggregate({
      where: { spaceId: id },
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      ...space,
      foto_galeri: space.fotoGaleri.map((f) => ({ id: f.id, url: f.url, urutan: f.urutan })),
      rating_rata_rata: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
      total_review: reviewAgg._count.id,
    };
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

    // Cek apakah space memiliki histori reservasi
    const countReservasi = await this.prisma.detailReservasi.count({
      where: { spaceId: id },
    });

    if (countReservasi > 0) {
      throw new BadRequestException('Space tidak dapat dihapus karena memiliki histori reservasi');
    }

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

  // --- Gallery methods ---

  private async assertSpaceOwnership(spaceId: number, ownerId: number) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space tidak ditemukan');
    if (space.ownerId !== ownerId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke space ini');
    }
    return space;
  }

  async addFotoGaleri(spaceId: number, ownerId: number, url: string) {
    await this.assertSpaceOwnership(spaceId, ownerId);

    // Auto-increment urutan
    const lastFoto = await this.prisma.spaceFoto.findFirst({
      where: { spaceId },
      orderBy: { urutan: 'desc' },
    });
    const urutan = (lastFoto?.urutan ?? 0) + 1;

    const foto = await this.prisma.spaceFoto.create({
      data: { spaceId, url, urutan },
    });

    return { id: foto.id, url: foto.url, urutan: foto.urutan };
  }

  async removeFotoGaleri(spaceId: number, fotoId: number, ownerId: number) {
    await this.assertSpaceOwnership(spaceId, ownerId);

    const foto = await this.prisma.spaceFoto.findFirst({
      where: { id: fotoId, spaceId },
    });
    if (!foto) throw new NotFoundException('Foto tidak ditemukan di space ini');

    await this.prisma.spaceFoto.delete({ where: { id: fotoId } });
    return { id: fotoId, deleted: true };
  }
}