import { Controller, Get, Post, Param, Body, Query, HttpCode } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewActionDto } from './dto/review-action.dto';

@Controller('api/admin')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  getQueue(@Query('page') page = '1', @Query('perPage') perPage = '50') {
    return this.reviewService.getQueue(+page, +perPage);
  }

  @Post('submissions/:id/approve')
  @HttpCode(200)
  approve(@Param('id') id: string, @Body() dto: ReviewActionDto) {
    return this.reviewService.approve(id, dto.note ?? '');
  }

  @Post('submissions/:id/reject')
  @HttpCode(200)
  reject(@Param('id') id: string, @Body() dto: ReviewActionDto) {
    return this.reviewService.reject(id, dto.note ?? '');
  }

  @Post('submissions/:id/escalate')
  @HttpCode(200)
  escalate(@Param('id') id: string, @Body() dto: ReviewActionDto) {
    return this.reviewService.escalate(id, dto.note ?? '');
  }

  @Post('payouts/release')
  @HttpCode(200)
  async release() {
    const { PayoutService } = await import('../payout/payout.service');
    return { message: 'Trigger via cron scheduler or POST /api/admin/payouts/release' };
  }
}
