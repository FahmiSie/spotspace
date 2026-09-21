import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterAdminSpaceDto } from './dto/register-admin-space.dto';
import { LoginDto } from './dto/login.dto';

import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private emailService: EmailService,
  ) {}

  // ─── MEMBER REGISTRATION ─────────────────────────────────────────
  async registerMember(dto: RegisterMemberDto) {
    // Check uniqueness of username and email
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) throw new ConflictException('Username already taken');

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email.toLowerCase().trim(),
        password: hashed,
        role: 'member',
        isVerified: false,
        otpCode: otpCode,
        otpExpiresAt: otpExpiresAt,
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

    // Send OTP email (safe-fail — won't crash registration)
    await this.emailService.sendOtpEmail(dto.email.toLowerCase().trim(), dto.nama_member, otpCode);

    return {
      message: 'Registration successful. Please verify your OTP.',
      email: user.email,
    };
  }

  // ─── ADMIN REGISTRATION ──────────────────────────────────────────
  async registerAdminSpace(dto: RegisterAdminSpaceDto) {
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) throw new ConflictException('Username already taken');

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email.toLowerCase().trim(),
        password: hashed,
        role: 'admin_space',
        isVerified: false,
        otpCode: otpCode,
        otpExpiresAt: otpExpiresAt,
        spaceOwner: {
          create: {
            namaCoworking: dto.namaCoworking,
            namaPemilik: dto.namaPemilik,
            telp: dto.telp,
          },
        },
      },
      include: { spaceOwner: true },
    });

    await this.emailService.sendOtpEmail(dto.email.toLowerCase().trim(), dto.namaPemilik, otpCode);

    return {
      message: 'Registration successful. Please verify your OTP.',
      email: user.email,
    };
  }

  // ─── LOGIN (HYBRID: EMAIL OR USERNAME) ───────────────────────────
  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
      include: { member: true, spaceOwner: true },
    });

    if (!user) throw new UnauthorizedException('Invalid email/username or password');

    // Guard: Google-only accounts have no local password
    if (!user.password) {
      throw new UnauthorizedException(
        'This account was registered via Google. Please sign in with Google.',
      );
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid email/username or password');

    // Guard: New accounts with email must verify OTP first.
    // Legacy accounts (email is null) are exempt from this check.
    if (user.email && !user.isVerified) {
      throw new ForbiddenException('Please verify your account via OTP first');
    }

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

  // ─── VERIFY OTP ──────────────────────────────────────────────────
  async verifyAccountOtp(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP code found. Please request a new one.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP code has expired. Please request a new one.');
    }

    if (user.otpCode !== code) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Account verified successfully. You can now login.' };
  }

  // ─── RESEND OTP ──────────────────────────────────────────────────
  async resendAccountOtp(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { member: true, spaceOwner: true },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otpCode,
        otpExpiresAt: otpExpiresAt,
      },
    });

    const userName = user.member?.namaMember || user.spaceOwner?.namaPemilik || user.username;
    await this.emailService.sendOtpEmail(email.toLowerCase().trim(), userName, otpCode);

    return { message: 'A new verification code has been sent to your email.' };
  }

  // ─── GOOGLE OAUTH ────────────────────────────────────────────────
  async googleLogin(googleProfile: {
    googleId: string;
    email: string;
    displayName: string;
    foto: string | null;
    role: string;
  }) {
    const { googleId, email, displayName, foto, role } = googleProfile;
    const validRole = role === 'admin_space' ? 'admin_space' : 'member';

    // 1. Find user by googleId (returning user)
    let user = await this.prisma.user.findUnique({
      where: { googleId },
      include: { member: true, spaceOwner: true },
    });

    if (user) {
      const accessToken = this.generateToken(user.id, user.username, user.role);
      return { accessToken, role: user.role };
    }

    // 2. Check if email is already used by a local account
    if (email) {
      const existingByEmail = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: email },
            { email: email.toLowerCase() },
          ],
        },
      });
      if (existingByEmail && existingByEmail.authProvider === 'local') {
        throw new ConflictException(
          'This email is already registered. Log in with your password, or link your Google account from profile settings.',
        );
      }
    }

    // 3. Create new user
    const username = email || `google_${googleId}`;

    if (validRole === 'member') {
      user = await this.prisma.user.create({
        data: {
          username,
          email: email?.toLowerCase() || null,
          password: null,
          googleId,
          authProvider: 'google',
          role: 'member',
          isVerified: true, // Google accounts are auto-verified
          member: {
            create: {
              namaMember: displayName || 'Member',
              alamat: '',
              telp: '',
              foto,
            },
          },
        },
        include: { member: true, spaceOwner: true },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          username,
          email: email?.toLowerCase() || null,
          password: null,
          googleId,
          authProvider: 'google',
          role: 'admin_space',
          isVerified: true,
          spaceOwner: {
            create: {
              namaCoworking: displayName || 'Coworking Space',
              namaPemilik: displayName || 'Owner',
              telp: '',
              foto,
            },
          },
        },
        include: { member: true, spaceOwner: true },
      });
    }

    const accessToken = this.generateToken(user.id, user.username, user.role);
    return { accessToken, role: user.role };
  }

  // ─── PROFILE ─────────────────────────────────────────────────────
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { member: true, spaceOwner: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      memberId: user.member?.id ?? null,
      spaceOwnerId: user.spaceOwner?.id ?? null,
      member: user.member
        ? {
            id: user.member.id,
            nama_member: user.member.namaMember,
            instansi: user.member.instansi,
            alamat: user.member.alamat,
            telp: user.member.telp,
            foto: user.member.foto,
          }
        : null,
      spaceOwner: user.spaceOwner
        ? {
            id: user.spaceOwner.id,
            nama_coworking: user.spaceOwner.namaCoworking,
            nama_pemilik: user.spaceOwner.namaPemilik,
            telp: user.spaceOwner.telp,
            foto: user.spaceOwner.foto,
          }
        : null,
    };
  }

  // ─── LEGACY OTP (email-based passwordless login — kept for compat) ──
  async sendOtp(email: string) {
    const existing = await this.prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const diff = new Date().getTime() - existing.createdAt.getTime();
      if (diff < 60000) {
        throw new ConflictException('Please wait 60 seconds before requesting a new OTP');
      }
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(new Date().getTime() + 5 * 60000);

    await this.prisma.otp.deleteMany({ where: { email } });
    await this.prisma.otp.create({
      data: {
        email,
        code: hashedCode,
        expiresAt,
      },
    });

    await this.emailService.sendOtpEmail(email, 'User', code);
    return { success: true, message: 'OTP code has been sent to your email.' };
  }

  async verifyOtp(email: string, code: string) {
    const otp = await this.prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    const isValid = await bcrypt.compare(code, otp.code);
    if (!isValid || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    await this.prisma.otp.deleteMany({ where: { email } });

    let user = await this.prisma.user.findUnique({
      where: { username: email },
      include: { member: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          username: email,
          authProvider: 'email_otp',
          role: 'member',
          isVerified: true,
          member: {
            create: {
              namaMember: email.split('@')[0],
              alamat: '-',
              telp: '-',
            },
          },
        },
        include: { member: true },
      });
    }

    const accessToken = this.generateToken(user.id, user.username, user.role);
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      member: user.member,
    };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────
  private generateToken(sub: number, username: string, role: string) {
    return this.jwt.sign({ sub, username, role });
  }
}
