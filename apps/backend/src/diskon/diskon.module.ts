import { Module } from '@nestjs/common';
import { DiskonService } from './diskon.service';
import { DiskonController } from './diskon.controller';
import { NotifikasiModule } from '../notifikasi/notifikasi.module';

@Module({
  imports: [NotifikasiModule],
  providers: [DiskonService],
  controllers: [DiskonController],
})
export class DiskonModule {}