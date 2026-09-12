import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  providers: [MembersService],
  controllers: [MembersController]
})
export class MembersModule {}
