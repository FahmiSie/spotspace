import { Controller, Get, Patch, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotifikasiService } from './notifikasi.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/notifikasi')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('member', 'admin_space')
export class NotifikasiController {
  constructor(private notifikasiService: NotifikasiService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.notifikasiService.findByUser(req.user.userId);
  }

  // IMPORTANT: read-all route MUST be before :id route to avoid conflict
  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notifikasiService.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notifikasiService.markAsRead(id, req.user.userId);
  }
}
