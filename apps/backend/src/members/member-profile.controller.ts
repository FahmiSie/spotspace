import { Controller, Put, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

class UpdateFotoDto {
  @IsString() @IsNotEmpty()
  foto: string; // url hasil upload dari /api/upload/members
}

@Controller('api/member/profile')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('member')
export class MemberProfileController {
  constructor(private prisma: PrismaService) {}

  @Put('foto')
  async updateFoto(@Req() req: any, @Body() dto: UpdateFotoDto) {
    const updated = await this.prisma.member.update({
      where: { id: req.user.memberId },
      data: { foto: dto.foto },
    });
    return { id: updated.id, foto: updated.foto };
  }
}