import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpaceModule } from './spaces/space.module';
import { DiskonModule } from './diskon/diskon.module';
import { ReservasiModule } from './reservasi/reservasi.module';
import { MembersModule } from './members/members.module';
import { ReportsModule } from './reports/reports.module';
import { ReviewModule } from './review/review.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { NotifikasiModule } from './notifikasi/notifikasi.module';
import { EmailModule } from './email/email.module';
import { UploadModule } from './upload/upload.module';
import { PaymentModule } from './payment/payment.module';
import { GeocodingModule } from './geocoding/geocoding.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    SpaceModule,
    DiskonModule,
    ReservasiModule,
    MembersModule,
    ReportsModule,
    ReviewModule,
    WishlistModule,
    NotifikasiModule,
    EmailModule,
    UploadModule,
    PaymentModule,
    GeocodingModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
