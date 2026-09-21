import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { EmailService } from './email/email.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('api/contact')
  async handleContact(
    @Body() body: { name: string; email: string; subject: string; message: string }
  ) {
    const { name, email, subject, message } = body;
    if (!name || !email || !subject || !message) {
      throw new BadRequestException('Semua field (name, email, subject, message) wajib diisi');
    }

    await this.emailService.sendContactEmail(name, email, subject, message);
    return { success: true, message: 'Pesan kontak berhasil dikirim.' };
  }
}
