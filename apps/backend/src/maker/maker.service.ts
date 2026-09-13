import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMakerDto } from './dto/register-maker.dto';
import { LoginMakerDto } from './dto/login-maker.dto';

@Injectable()
export class MakerService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterMakerDto) {
    // Check uniqueness
    const existingUsername = await this.prisma.maker.findUnique({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictException('Username sudah digunakan');

    const existingEmail = await this.prisma.maker.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email sudah digunakan');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const appKey = 'mk_' + crypto.randomBytes(16).toString('hex');

    const maker = await this.prisma.maker.create({
      data: {
        name: dto.name,
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        appKey,
      },
    });

    const accessToken = this.generateToken(maker.id, maker.username);

    return {
      id: maker.id,
      name: maker.name,
      username: maker.username,
      email: maker.email,
      app_key: maker.appKey,
      created_at: maker.createdAt,
      access_token: accessToken,
    };
  }

  async login(dto: LoginMakerDto) {
    // Match username OR email
    const maker = await this.prisma.maker.findFirst({
      where: {
        OR: [
          { username: dto.usernameOrEmail },
          { email: dto.usernameOrEmail },
        ],
      },
    });
    if (!maker) throw new UnauthorizedException('Username/email atau password salah');

    const match = await bcrypt.compare(dto.password, maker.password);
    if (!match) throw new UnauthorizedException('Username/email atau password salah');

    const accessToken = this.generateToken(maker.id, maker.username);

    return {
      id: maker.id,
      name: maker.name,
      username: maker.username,
      email: maker.email,
      app_key: maker.appKey,
      created_at: maker.createdAt,
      access_token: accessToken,
    };
  }

  async getProfile(maker: any) {
    return {
      id: maker.id,
      name: maker.name,
      username: maker.username,
      email: maker.email,
      app_key: maker.appKey,
      created_at: maker.createdAt,
    };
  }

  async getStats() {
    const [totalMembers, totalSpaces, totalDiskon, totalReservasi, pendapatanAgg] =
      await Promise.all([
        this.prisma.member.count(),
        this.prisma.space.count(),
        this.prisma.diskon.count(),
        this.prisma.reservasi.count(),
        this.prisma.detailReservasi.aggregate({
          where: { reservasi: { status: 'selesai' } },
          _sum: { totalBayar: true },
        }),
      ]);

    return {
      total_members: totalMembers,
      total_spaces: totalSpaces,
      total_diskon: totalDiskon,
      total_reservasi: totalReservasi,
      total_pendapatan: pendapatanAgg._sum.totalBayar ?? 0,
    };
  }

  async findAll() {
    const makers = await this.prisma.maker.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return makers.map((m) => ({
      id: m.id,
      name: m.name,
      username: m.username,
      email: m.email,
      app_key: m.appKey,
      created_at: m.createdAt,
    }));
  }

  private generateToken(sub: number, username: string) {
    return this.jwt.sign({ sub, username, type: 'maker' });
  }
}
