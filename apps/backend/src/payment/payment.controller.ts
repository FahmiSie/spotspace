import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ChargeQrisDto } from './dto/charge-qris.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('charge')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member')
  async chargeQris(@Req() req: any, @Body() dto: ChargeQrisDto) {
    return this.paymentService.createQrisCharge(req.user.userId, dto.kodeBooking);
  }

  @Get('status/:kodeBooking')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member')
  async checkStatus(@Req() req: any, @Param('kodeBooking') kodeBooking: string) {
    return this.paymentService.checkPaymentStatus(req.user.userId, kodeBooking);
  }

  @Post('notification')
  async handleNotification(@Body() payload: any) {
    return this.paymentService.handleNotification(payload);
  }

  @Post('snap-token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member')
  async createSnapToken(@Req() req: any, @Body() dto: ChargeQrisDto) {
    return this.paymentService.createSnapToken(req.user.userId, dto.kodeBooking);
  }

  @Post('simulate-pay')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member')
  async simulatePay(@Req() req: any, @Body() body: { kodeBooking: string }) {
    return this.paymentService.simulateSandboxPayment(req.user.userId, body.kodeBooking);
  }
}
