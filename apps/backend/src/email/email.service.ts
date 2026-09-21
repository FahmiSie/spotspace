import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s+/g, ''), // hilangkan spasi jika ada
      },
    });
  }

  /**
   * Mengirim email OTP Verifikasi
   */
  async sendOtpEmail(to: string, userName: string, otpCode: string): Promise<boolean> {
    // Fallback console log untuk kelancaran presentasi UKK
    console.log(`\x1b[33m[OTP VERIFICATION]\x1b[0m Code for ${to}: ${otpCode}`);

    const fromAddress = process.env.EMAIL_FROM || `"SpotSpace" <${process.env.SMTP_USER}>`;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 22px; font-weight: 800; color: #1c1917; letter-spacing: -0.5px;">Spot<span style="color: #ea580c;">Space</span></span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin-bottom: 8px;">Verify your account</h2>
        <p style="font-size: 14px; color: #57534e; line-height: 1.5; margin-bottom: 24px;">
          Hi <strong>${userName}</strong>, thank you for registering with SpotSpace. Use the verification code below to complete your registration.
        </p>
        <div style="background-color: #fafaf9; border: 1px dashed #d6d3d1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c;">${otpCode}</span>
        </div>
        <p style="font-size: 12px; color: #a8a29e; line-height: 1.5; margin-bottom: 0;">
          This code is valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject: `${otpCode} is your SpotSpace verification code`,
        html: htmlContent,
      });

      this.logger.log(`OTP email sent successfully via Gmail SMTP to ${to}`);
      return true;
    } catch (error: any) {
      this.logger.warn(`[SMTP WARNING] Failed to send email via Gmail SMTP: ${error.message}`);
      // Safe-fail: jangan melempar error agar alur registrasi tidak terhenti jika koneksi lambat
      return false;
    }
  }

  /**
   * Mengirim email dari form Contact Us
   */
  async sendContactEmail(name: string, email: string, subject: string, message: string) {
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Pesan Kontak Baru dari SpotSpace</h2>
        <p><strong>Nama:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subjek:</strong> ${subject}</p>
        <hr />
        <p><strong>Pesan:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SpotSpace" <onboarding@resend.dev>',
        to: 'fahmiaqila.m0@gmail.com', // fallback ke email owner atau yang lain
        replyTo: email,
        subject: `[Contact Us] ${subject}`,
        html: htmlContent,
      });
      this.logger.log(`Contact email from ${email} sent successfully`);
    } catch (error: any) {
      this.logger.error(`Failed to send contact email: ${error.message}`);
    }
  }
}
