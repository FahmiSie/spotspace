import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID || 'not-configured';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'not-configured';

    super({
      clientID,
      clientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: true as const,
    });
  }

  authenticate(req: any, options?: any) {
    // Jika belum dikonfigurasi, tolak langsung
    if (process.env.GOOGLE_CLIENT_ID === undefined || process.env.GOOGLE_CLIENT_ID === '') {
      return this.fail({ message: 'Google OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env' }, 501);
    }
    // Ambil role dari query param dan simpan di state OAuth
    const role = req.query?.role || 'member';
    super.authenticate(req, {
      ...options,
      state: role,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value,
      displayName,
      foto: photos?.[0]?.value ?? null,
      role: req.query?.state || 'member', // role dari state param OAuth
    };
    done(null, user);
  }
}
