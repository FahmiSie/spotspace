import { Module } from '@nestjs/common';
import { ReservasiService } from './reservasi.service';
import { ReservasiController } from './reservasi.controller';
import { NotifikasiModule } from '../notifikasi/notifikasi.module';

@Module({
  imports: [NotifikasiModule],
  providers: [ReservasiService],
  controllers: [ReservasiController],
})
export class ReservasiModule {}