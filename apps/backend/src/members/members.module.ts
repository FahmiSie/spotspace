import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberProfileController } from './member-profile.controller';

@Module({
  providers: [MembersService],
  controllers: [MembersController, MemberProfileController],
})
export class MembersModule {}
