import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewService.createReview(req.user.userId, dto);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin_space')
  getAdminReviews(@Req() req: any) {
    return this.reviewService.getAdminReviews(req.user.userId);
  }

  @Get('space/:spaceId')
  getReviewsBySpace(@Param('spaceId', ParseIntPipe) spaceId: number) {
    return this.reviewService.getReviewsBySpace(spaceId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('eligibility/:spaceId')
  checkEligibility(@Req() req: any, @Param('spaceId', ParseIntPipe) spaceId: number) {
    return this.reviewService.checkReviewEligibility(req.user.userId, spaceId);
  }
}
