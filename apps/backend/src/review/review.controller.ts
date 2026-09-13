import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  // POST /api/review — role: member
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member')
  @Post('review')
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(req.user.memberId, dto);
  }

  // GET /api/spaces/:id/reviews — publik
  @Get('spaces/:id/reviews')
  findBySpace(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.findBySpace(id);
  }
}
