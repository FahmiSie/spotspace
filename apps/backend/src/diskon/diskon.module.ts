import { Module } from '@nestjs/common';
import { DiskonService } from './diskon.service';
import { DiskonController } from './diskon.controller';

@Module({
  providers: [DiskonService],
  controllers: [DiskonController],
})
export class DiskonModule {}