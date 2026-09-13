import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MakerService } from './maker.service';
import { MakerController } from './maker.controller';
import { MakerAuthGuard } from './guards/maker-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [MakerService, MakerAuthGuard],
  controllers: [MakerController],
})
export class MakerModule {}
