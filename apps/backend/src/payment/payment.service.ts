import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as midtransClient from 'midtrans-client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private coreApi: any;
  private snap: any;

  constructor(private prisma: PrismaService) {
    this.coreApi = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });

    this.snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }

  async createSnapToken(userId: number, kodeBooking: string) {
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { kodeBooking },
      include: {
        member: { include: { user: true } },
        detail: true,
      },
    });

    if (!reservasi) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    if (reservasi.member.userId !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengakses transaksi ini');
    }

    if (!reservasi.detail) {
      throw new NotFoundException('Detail reservasi tidak ditemukan');
    }

    const orderId = `${reservasi.kodeBooking}-${Math.floor(Date.now() / 1000)}`;
    const grossAmount = Math.round(Number(reservasi.detail.totalBayar));

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: reservasi.member.namaMember || 'Member',
        phone: reservasi.member.telp,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      
      await this.prisma.$transaction(async (tx) => {
        await tx.reservasi.update({
          where: { kodeBooking },
          data: { midtransOrderId: orderId },
        });

        await tx.payment.upsert({
          where: { reservasiId: reservasi.id },
          update: {
            midtransOrderId: orderId,
            grossAmount: grossAmount,
            status: 'pending',
          },
          create: {
            reservasiId: reservasi.id,
            midtransOrderId: orderId,
            grossAmount: grossAmount,
            status: 'pending',
          },
        });
      });

      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
      };
    } catch (error: any) {
      console.error("Midtrans Snap Error:", error?.response?.data || error?.message || error);
      throw new Error(error?.response?.data?.message || error?.message || "Failed to create snap token");
    }
  }

  async createQrisCharge(userId: number, kodeBooking: string) {
    // Legacy support if needed
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { kodeBooking },
      include: {
        member: true,
        detail: true,
      },
    });

    if (!reservasi) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    if (reservasi.member.userId !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengakses transaksi ini');
    }

    if (!reservasi.detail) {
      throw new NotFoundException('Detail reservasi tidak ditemukan');
    }

    const orderId = `${reservasi.kodeBooking}-${Math.floor(Date.now() / 1000)}`;
    const grossAmount = Math.round(Number(reservasi.detail.totalBayar));

    const parameter = {
      payment_type: 'gopay',
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      gopay: {
        enable_callback: true,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reservasi`,
      },
    };

    try {
      const chargeResponse = await this.coreApi.charge(parameter);
      console.log("Midtrans Charge Response:", chargeResponse);

      await this.prisma.$transaction(async (tx) => {
        await tx.reservasi.update({
          where: { kodeBooking },
          data: { midtransOrderId: orderId },
        });

        await tx.payment.upsert({
          where: { reservasiId: reservasi.id },
          update: {
            midtransOrderId: orderId,
            grossAmount: grossAmount,
            status: 'pending',
          },
          create: {
            reservasiId: reservasi.id,
            midtransOrderId: orderId,
            grossAmount: grossAmount,
            status: 'pending',
          },
        });
      });

      const qrAction = chargeResponse.actions?.find(
        (action: any) => action.name === 'generate-qr-code'
      );
      const deeplinkAction = chargeResponse.actions?.find(
        (action: any) => action.name === 'deeplink-redirect' || action.name === 'generate-deeplink'
      );

      return {
        orderId: chargeResponse.order_id,
        transactionId: chargeResponse.transaction_id,
        grossAmount: chargeResponse.gross_amount,
        transactionStatus: chargeResponse.transaction_status,
        qrCodeUrl: qrAction?.url || null,
        deeplinkUrl: deeplinkAction?.url || null,
        qrString: chargeResponse.qr_string || null,
      };
    } catch (error: any) {
      console.error("Midtrans Charge Error:", error?.response?.data || error?.message || error);
      throw new Error(error?.response?.data?.message || error?.message || "Failed to charge QRIS");
    }
  }

  async checkPaymentStatus(userId: number, kodeBooking: string) {
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { kodeBooking },
      include: { member: true, payment: true },
    });

    if (!reservasi || reservasi.member.userId !== userId) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    const orderId = reservasi.payment?.midtransOrderId || reservasi.midtransOrderId || reservasi.kodeBooking;

    try {
      const statusResponse = await this.coreApi.transaction.status(orderId);

      if (statusResponse.transaction_status === 'settlement' || statusResponse.transaction_status === 'capture') {
        if (reservasi.payment) {
          await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: reservasi.payment!.id },
              data: { status: 'paid', paidAt: new Date(), transactionId: statusResponse.transaction_id },
            });
            await tx.reservasi.update({
              where: { id: reservasi.id },
              data: { status: 'menunggu_persetujuan' },
            });
          });
        }
        return { isPaid: true, status: statusResponse.transaction_status };
      }

      if (statusResponse.transaction_status === 'expire' || statusResponse.transaction_status === 'cancel' || statusResponse.transaction_status === 'deny') {
        if (reservasi.payment) {
          await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: reservasi.payment!.id },
              data: { status: statusResponse.transaction_status === 'expire' ? 'expired' : 'failed' },
            });
            await tx.reservasi.update({
              where: { id: reservasi.id },
              data: { status: 'dibatalkan' },
            });
          });
        }
        return { isPaid: false, status: statusResponse.transaction_status };
      }

      return { isPaid: false, status: statusResponse.transaction_status };
    } catch (error) {
      return { isPaid: false, status: 'pending' };
    }
  }

  async handleNotification(payload: any) {
    console.log("Midtrans Notification Payload:", payload);
    const { order_id, status_code, gross_amount, transaction_status, signature_key, payment_type, transaction_id } = payload;
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    const hashString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    if (hash !== signature_key) {
      console.error("Midtrans Webhook: Invalid signature key");
      throw new ForbiddenException('Invalid signature');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { midtransOrderId: order_id }
    });

    if (!payment) {
      return { status: 'ignored', reason: 'Payment not found' };
    }

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { midtransOrderId: order_id },
          data: {
            status: 'paid',
            paymentType: payment_type,
            transactionId: transaction_id,
            signatureKey: signature_key,
            paidAt: new Date()
          }
        });
        
        await tx.reservasi.update({
          where: { id: payment.reservasiId },
          data: { status: 'menunggu_persetujuan' }
        });
      });
      console.log(`Payment and Reservasi status updated to paid/menunggu_persetujuan for order ${order_id}`);
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { midtransOrderId: order_id },
          data: {
            status: transaction_status === 'expire' ? 'expired' : 'failed',
            paymentType: payment_type,
            transactionId: transaction_id
          }
        });
        
        await tx.reservasi.update({
          where: { id: payment.reservasiId },
          data: { status: 'dibatalkan' }
        });
      });
      console.log(`Payment and Reservasi status updated to ${transaction_status}/dibatalkan for order ${order_id}`);
    }

    return { status: 'ok' };
  }

  async simulateSandboxPayment(userId: number, kodeBooking: string) {
    const reservasi = await this.prisma.reservasi.findUnique({
      where: { kodeBooking },
      include: { payment: true, member: true },
    });

    if (!reservasi) {
      throw new NotFoundException('Reservasi tidak ditemukan');
    }

    if (reservasi.member.userId !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengakses transaksi ini');
    }

    if (!reservasi.payment) {
      throw new NotFoundException('Data payment tidak ditemukan untuk reservasi ini');
    }

    try {
      const settleResponse = await this.coreApi.transaction.settle(reservasi.payment.midtransOrderId);
      
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: reservasi.payment!.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        });
        await tx.reservasi.update({
          where: { id: reservasi.id },
          data: { status: 'menunggu_persetujuan' },
        });
      });

      return { success: true, message: 'Payment successfully settled via Sandbox API', data: settleResponse };
    } catch (error: any) {
      console.error("Midtrans Settle Error:", error?.response?.data || error?.message || error);
      throw new Error(error?.response?.data?.message || error?.message || "Failed to settle payment in Sandbox");
    }
  }
}
