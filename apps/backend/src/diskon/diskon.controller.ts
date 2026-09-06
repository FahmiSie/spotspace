import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
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
  findAll() {
    return this.diskonService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Post('admin/diskon')
  create(@Body() dto: CreateDiskonDto) {
    return this.diskonService.create(dto);
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiskonDto) {
    return this.diskonService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Delete('admin/diskon/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.diskonService.remove(id);
  }
}