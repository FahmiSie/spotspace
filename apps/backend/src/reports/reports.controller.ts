import { Controller, Get, Query, UseGuards, Req, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { MonthlyQueryDto } from './dto/monthly-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin_space')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  getMonthly(@Req() req: any, @Query() query: MonthlyQueryDto) {
    return this.reportsService.getMonthly(req.user.spaceOwnerId, query);
  }

  @Get('income')
  getIncome(@Req() req: any, @Query() query: MonthlyQueryDto) {
    // alias — sesuai kontrak panitia endpoint ini return ringkasan yang sama
    return this.reportsService.getMonthly(req.user.spaceOwnerId, query);
  }

  @Get('monthly/export')
  async exportReport(
    @Req() req: any,
    @Query() query: MonthlyQueryDto,
    @Query('format') format: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (format === 'pdf') {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="laporan-pendapatan.pdf"',
      });
      return this.reportsService.exportPdf(req.user.spaceOwnerId, query);
    } else if (format === 'xlsx') {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="laporan-pendapatan.xlsx"',
      });
      return this.reportsService.exportXlsx(req.user.spaceOwnerId, query);
    } else {
      throw new BadRequestException('Format tidak didukung. Gunakan format=pdf atau format=xlsx');
    }
  }
}