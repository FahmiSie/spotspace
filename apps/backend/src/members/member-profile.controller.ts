import { Controller, Get, Put, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

class UpdateFotoDto {
  @IsString() @IsNotEmpty()
  foto: string; // url hasil upload dari /api/upload/members
}

class UpdateProfileDto {
  @IsString() @IsOptional()
  name?: string;

  @IsString() @IsOptional()
  occupation?: string;

  @IsString() @IsOptional()
  phone?: string;
}

@Controller('api/member/profile')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('member')
export class MemberProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getProfile(@Req() req: any) {
    if (!req.user.memberId) throw new UnauthorizedException('Profil member tidak ditemukan');
    const member = await this.prisma.member.findUnique({
      where: { id: req.user.memberId },
      include: {
        user: { select: { username: true, email: true } }
      }
    });
    return member;
  }

  @Put()
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    if (!req.user.memberId) throw new UnauthorizedException('Profil member tidak ditemukan');
    const updated = await this.prisma.member.update({
      where: { id: req.user.memberId },
      data: { 
        namaMember: dto.name,
        instansi: dto.occupation,
        telp: dto.phone,
      },
      include: {
        user: { select: { username: true, email: true } }
      }
    });
    return updated;
  }

  @Put('foto')
  async updateFoto(@Req() req: any, @Body() dto: UpdateFotoDto) {
    if (!req.user.memberId) throw new UnauthorizedException('Profil member tidak ditemukan');
    const updated = await this.prisma.member.update({
      where: { id: req.user.memberId },
      data: { foto: dto.foto },
    });
    return { id: updated.id, foto: updated.foto };
  }
}