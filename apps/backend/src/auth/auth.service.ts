import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterAdminSpaceDto } from './dto/register-admin-space.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async registerMember(dto: RegisterMemberDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username sudah digunakan');

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

    const accessToken = this.generateToken(user.id, user.username, user.role);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      member: user.member,
      accessToken,
    };
  }

  async registerAdminSpace(dto: RegisterAdminSpaceDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username sudah digunakan');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashed,
        role: 'admin_space',
        spaceOwner: {
          create: {
            namaCoworking: dto.namaCoworking,
            namaPemilik: dto.namaPemilik,
            telp: dto.telpon,
          },
        },
      },
      include: { spaceOwner: true },
    });

    const accessToken = this.generateToken(user.id, user.username, user.role);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      spaceOwner: user.spaceOwner,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { member: true, spaceOwner: true },
    });
    if (!user) throw new UnauthorizedException('Username atau password salah');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Username atau password salah');

    const accessToken = this.generateToken(user.id, user.username, user.role);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      member: user.member,
      spaceOwner: user.spaceOwner,
      accessToken,
    };
  }

  private generateToken(sub: number, username: string, role: string) {
    return this.jwt.sign({ sub, username, role });
  }
}
