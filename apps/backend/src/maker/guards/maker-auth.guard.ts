import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Custom guard for Maker endpoints — completely separate from member/admin JwtStrategy.
 * Accepts EITHER:
 *   1. Bearer token with payload { type: 'maker' }
 *   2. Header 'x-maker-key' containing a valid appKey
 */
@Injectable()
export class MakerAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Try x-maker-key header first
    const makerKey = request.headers['x-maker-key'] as string;
    if (makerKey) {
      const maker = await this.prisma.maker.findUnique({ where: { appKey: makerKey } });
      if (!maker) throw new UnauthorizedException('Invalid x-maker-key');
      request.maker = maker;
      return true;
    }

    // Try Bearer token
    const authHeader = request.headers['authorization'] as string;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token atau x-maker-key diperlukan');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwt.verify(token);
      if (payload.type !== 'maker') {
        throw new UnauthorizedException('Token ini bukan token maker');
      }

      const maker = await this.prisma.maker.findUnique({ where: { id: payload.sub } });
      if (!maker) throw new UnauthorizedException('Maker tidak ditemukan');

      request.maker = maker;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token tidak valid atau sudah expired');
    }
  }
}
