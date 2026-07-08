import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PayoutService } from './payout.service';

@Injectable()
export class PayoutScheduler {
  private readonly logger = new Logger(PayoutScheduler.name);

  constructor(private readonly payoutService: PayoutService) {}

  @Cron('0 */15 * * * *')  // every 15 minutes
  async handlePayoutRelease() {
    if (process.env.NODE_ENV !== 'production') return;
    try {
      const released = await this.payoutService.releaseDuePayouts();
      if (released.length) this.logger.log(`Released ${released.length} payout(s)`);
    } catch (err) {
      this.logger.error(`Payout release job failed: ${err.message}`);
    }
  }
}
