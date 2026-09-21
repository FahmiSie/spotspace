import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiskonService } from './diskon.service';
import { CreateDiskonDto } from './dto/create-diskon.dto';
import { UpdateDiskonDto } from './dto/update-diskon.dto';
import { CheckPromoDto } from './dto/check-promo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api')
export class DiskonController {
  constructor(private diskonService: DiskonService) {}

  @Get('diskon/active')
  findAllActive() {
    return this.diskonService.findAllActive();
  }

  @Post('diskon/check')
  @HttpCode(HttpStatus.OK)
  checkPromo(@Body() dto: CheckPromoDto) {
    return this.diskonService.checkPromo(dto);
  }

  @Get('diskon/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.diskonService.findOne(id);
  }

  // --- Endpoint Admin ---
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Get('admin/diskon')
  findAll(@Req() req: any) {
    return this.diskonService.findAll(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Post('admin/diskon')
  create(@Req() req: any, @Body() dto: CreateDiskonDto) {
    return this.diskonService.create(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Get('admin/diskon/:id')
  findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.diskonService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Put('admin/diskon/:id')
  update(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Body() dto: UpdateDiskonDto) {
    return this.diskonService.update(id, req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Delete('admin/diskon/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.diskonService.remove(id, req.user.userId);
  }
}