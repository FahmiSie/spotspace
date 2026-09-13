import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api/wishlist')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('member')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Post()
  toggle(@Req() req: any, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggle(req.user.memberId, dto.id_space);
  }

  @Get('my')
  findMy(@Req() req: any) {
    return this.wishlistService.findMy(req.user.memberId);
  }
}
