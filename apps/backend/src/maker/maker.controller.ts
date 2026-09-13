import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MakerService } from './maker.service';
import { RegisterMakerDto } from './dto/register-maker.dto';
import { LoginMakerDto } from './dto/login-maker.dto';
import { MakerAuthGuard } from './guards/maker-auth.guard';

@Controller('api/maker')
export class MakerController {
  constructor(private makerService: MakerService) {}

  @Post('register')
  register(@Body() dto: RegisterMakerDto) {
    return this.makerService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginMakerDto) {
    return this.makerService.login(dto);
  }

  @UseGuards(MakerAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return this.makerService.getProfile(req.maker);
  }

  @UseGuards(MakerAuthGuard)
  @Get('stats')
  getStats() {
    return this.makerService.getStats();
  }

  @Get('list')
  findAll() {
    return this.makerService.findAll();
  }
}
