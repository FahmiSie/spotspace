import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpaceModule } from './spaces/space.module';
import { DiskonModule } from './diskon/diskon.module';
import { ReservasiModule } from './reservasi/reservasi.module';
import { MembersModule } from './members/members.module';

@Module({
  imports: [AuthModule, PrismaModule, SpaceModule, DiskonModule, ReservasiModule, MembersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
