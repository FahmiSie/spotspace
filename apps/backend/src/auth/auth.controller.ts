import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterAdminSpaceDto } from './dto/register-admin-space.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/member')
  registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @Post('register/admin-space')
  registerAdminSpace(@Body() dto: RegisterAdminSpaceDto) {
    return this.authService.registerAdminSpace(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─── Account OTP Verification (post-registration) ──────────────
  @Post('verify-account-otp')
  verifyAccountOtp(@Body() body: { email: string; code: string }) {
    return this.authService.verifyAccountOtp(body.email, body.code);
  }

  @Post('resend-account-otp')
  resendAccountOtp(@Body() body: { email: string }) {
    return this.authService.resendAccountOtp(body.email);
  }

  // ─── Legacy OTP (passwordless login) ───────────────────────────
  @Post('otp/send')
  sendOtp(@Body() body: { email: string }) {
    return this.authService.sendOtp(body.email);
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: { email: string; code: string }) {
    return this.authService.verifyOtp(body.email, body.code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  // --- Google OAuth ---

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google consent screen
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    try {
      const result = await this.authService.googleLogin(req.user);
      res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
    } catch (err: any) {
      const message = encodeURIComponent(err.message || 'Login failed');
      res.redirect(`${frontendUrl}/auth/login?error=${message}`);
    }
  }
}
