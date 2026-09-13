import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SpacesService } from './space.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { AddFotoDto } from './dto/add-foto.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api')
export class SpacesController {
  constructor(private spacesService: SpacesService) {}

  @Get('spaces/types')
  getTypes() {
    return this.spacesService.getTypes();
  }

  @Get('spaces/availability')
  checkAvailability(@Query() dto: CheckAvailabilityDto) {
    return this.spacesService.checkAvailability(dto);
  }

  @Get('spaces')
  findAll(
    @Query('tipe') tipe?: string,
    @Query('search') search?: string,
    @Query('min_harga') minHarga?: string,
    @Query('max_harga') maxHarga?: string,
    @Query('min_kapasitas') minKapasitas?: string,
  ) {
    return this.spacesService.findAll(tipe, search, {
      minHarga: minHarga ? Number(minHarga) : undefined,
      maxHarga: maxHarga ? Number(maxHarga) : undefined,
      minKapasitas: minKapasitas ? Number(minKapasitas) : undefined,
    });
  }

  @Get('spaces/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.findOne(id);
  }

  // --- Endpoint Admin ---
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Get('admin/spaces')
  findAllByOwner(@Req() req: any) {
    return this.spacesService.findAllByOwner(req.user.spaceOwnerId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Post('admin/spaces')
  create(@Req() req: any, @Body() dto: CreateSpaceDto) {
    return this.spacesService.create(req.user.spaceOwnerId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Get('admin/spaces/:id')
  findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Put('admin/spaces/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpaceDto) {
    return this.spacesService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Delete('admin/spaces/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.remove(id);
  }

  // --- Gallery endpoints ---
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Post('admin/spaces/:id/foto')
  addFoto(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Body() dto: AddFotoDto) {
    return this.spacesService.addFotoGaleri(id, req.user.spaceOwnerId, dto.url);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  @Delete('admin/spaces/:id/foto/:fotoId')
  removeFoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('fotoId', ParseIntPipe) fotoId: number,
    @Req() req: any,
  ) {
    return this.spacesService.removeFotoGaleri(id, fotoId, req.user.spaceOwnerId);
  }
}