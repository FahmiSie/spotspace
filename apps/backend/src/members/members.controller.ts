import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MembersService } from './members.service';
import { CreateMemberAdminDto } from './dto/create-member-admin.dto';
import { UpdateMemberAdminDto } from './dto/update-member-admin.dto';
import { UpdateCoworkingProfileDto } from './dto/update-coworking-profile.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin_space')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get('members')
  findAll(@Query('search') search?: string) {
    return this.membersService.findAll(search);
  }

  @Post('members')
  create(@Body() dto: CreateMemberAdminDto) {
    return this.membersService.create(dto);
  }

  @Get('members/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.findOne(id);
  }

  @Put('members/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberAdminDto) {
    return this.membersService.update(id, dto);
  }

  @Delete('members/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.remove(id);
  }

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.membersService.getProfile(req.user.spaceOwnerId);
  }

  @Put('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateCoworkingProfileDto) {
    return this.membersService.updateProfile(req.user.spaceOwnerId, dto);
  }
}