import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservasiService } from './reservasi.service';
import { CreateReservasiDto } from './dto/create-reservasi.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/reservasi')
@UseGuards(AuthGuard('jwt'))
export class ReservasiController {
  constructor(private reservasiService: ReservasiService) {}

  @Roles('member')
  @UseGuards(RolesGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateReservasiDto) {
    return this.reservasiService.create(req.user.memberId, dto);
  }

  @Roles('member')
  @UseGuards(RolesGuard)
  @Get('my')
  findMy(@Req() req: any) {
    return this.reservasiService.findMy(req.user.memberId);
  }

  @Roles('member')
  @UseGuards(RolesGuard)
  @Get('my/history')
  findHistory(@Req() req: any, @Query() query: HistoryQueryDto) {
    return this.reservasiService.findHistory(req.user.memberId, query);
  }

  @Get(':id/e-ticket')
  getETicket(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.reservasiService.getETicket(id, req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.reservasiService.findOne(id, req.user);
  }

  @Roles('member')
  @UseGuards(RolesGuard)
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.reservasiService.cancel(id, req.user.memberId);
  }
}