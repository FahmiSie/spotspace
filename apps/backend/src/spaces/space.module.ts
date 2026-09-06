import { Module } from '@nestjs/common';
import { SpacesService } from './space.service';
import { SpacesController } from './space.controller';

@Module({
  providers: [SpacesService],
  controllers: [SpacesController]
})
export class SpaceModule {}
