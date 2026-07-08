import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Submission } from '../entities/submission.entity';
import { PayoutLog } from '../entities/payout-log.entity';

const VALID_FRAUD_STATUSES = ['auto_passed', 'approved'];

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(PayoutLog)
    private readonly payoutLogRepo: Repository<PayoutLog>,
    private readonly config: ConfigService,
  ) {}

  async queuePayout(submissionId: string): Promise<void> {
    const sub = await this.subRepo.findOne({ where: { id: submissionId } });
    if (!sub) throw new Error(`Submission ${submissionId} not found`);

    if (sub.mpesaPayoutStatus === 'queued') return;

    if (!VALID_FRAUD_STATUSES.includes(sub.fraudStatus)) {
      throw new Error(`Cannot queue payout: fraudStatus is '${sub.fraudStatus}', must be 'auto_passed' or 'approved'`);
    }

    sub.mpesaPayoutStatus = 'queued';
    sub.payoutQueuedAt = new Date();
    await this.subRepo.save(sub);
    this.logger.log(`Payout queued for submission ${submissionId}`);
  }

  async releaseDuePayouts(): Promise<string[]> {
    if (process.env.NODE_ENV !== 'production') return [];

    const holdHours = this.config.get<number>('fraud.holdHours') ?? 48;
    const cutoff = new Date(Date.now() - holdHours * 60 * 60 * 1000);

    const due = await this.subRepo.find({
      where: {
        mpesaPayoutStatus: 'queued',
        payoutQueuedAt: LessThanOrEqual(cutoff),
        fraudStatus: In(VALID_FRAUD_STATUSES),
      },
    });

    const released: string[] = [];
    for (const sub of due) {
      try {
        const result = await this.sendMpesaPayout(sub);
        if (result.ok) released.push(sub.id);
      } catch (err) {
        this.logger.error(`Failed to release payout for ${sub.id}: ${err.message}`);
      }
    }

    return released;
  }

  async sendMpesaPayout(sub: Submission): Promise<{ ok: boolean; transactionId?: string; reason?: string }> {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('M-PESA payouts are disabled outside the production environment.');
    }
    if (!sub.phoneVerified) {
      throw new Error(`Phone not verified for submission ${sub.id}`);
    }
    if (!VALID_FRAUD_STATUSES.includes(sub.fraudStatus)) {
      throw new Error(`Invalid fraud status '${sub.fraudStatus}' for submission ${sub.id}`);
    }
    if (sub.mpesaPayoutStatus !== 'queued') {
      throw new Error(`Payout already processed for submission ${sub.id}: status is '${sub.mpesaPayoutStatus}'`);
    }

    const holdHours = this.config.get<number>('fraud.holdHours') ?? 48;
    const holdThreshold = new Date(Date.now() - holdHours * 60 * 60 * 1000);
    if (!sub.payoutQueuedAt || sub.payoutQueuedAt > holdThreshold) {
      throw new Error(`48-hour hold period not elapsed for submission ${sub.id}`);
    }

    const phone = sub.phoneE164;  // always pay the verified phone — never any other field
    if (!phone) {
      throw new Error(`No verified phone on submission ${sub.id}`);
    }

    const rawRequest = {
      phoneNumber: phone,
      currencyCode: 'KES',
      amount: sub.payoutAmount,
      reason: 'SurveyReward',
      metadata: { submissionId: sub.id, businessName: sub.businessName ?? '' },
    };

    try {
      const response = await this.callAtMpesa({ phone, rawRequest });
      const transactionId = response?.transactionId;

      if (transactionId) {
        sub.mpesaPayoutStatus = 'sent';
        sub.payoutReleasedAt = new Date();
        sub.payoutMpesaRef = transactionId;
        await this.subRepo.save(sub);

        await this.payoutLogRepo.save(this.payoutLogRepo.create({
          submissionId: sub.id,
          conversationId: transactionId,
          status: 'sent',
          amount: sub.payoutAmount,
          rawRequest,
          rawResponse: response,
        }));

        await this.sendConfirmationSms(phone);
        this.logger.log(`Payout sent for ${sub.id} → txn ${transactionId}`);
        return { ok: true, transactionId };
      }

      throw new Error(`No transactionId in AT response: ${JSON.stringify(response)}`);

    } catch (err) {
      this.logger.error(`Payout failed for ${sub.id}: ${err.message}`);
      sub.mpesaPayoutStatus = 'failed';
      sub.mpesaLastError = String(err.message).slice(0, 500);
      await this.subRepo.save(sub);

      await this.payoutLogRepo.save(this.payoutLogRepo.create({
        submissionId: sub.id,
        status: 'failed',
        amount: sub.payoutAmount,
        rawRequest,
        rawResponse: { error: err.message },
      }));

      return { ok: false, reason: 'at_api_error' };
    }
  }

  private async callAtMpesa(params: { phone: string; rawRequest: object }): Promise<{ transactionId?: string }> {
    const at = this.getAtClient();
    const response = await at.PAYMENTS.mobileB2C({
      productName: this.config.get('at.paymentProduct'),
      recipients: [params.rawRequest],
    });
    const entries: { transactionId?: string }[] = response?.entries ?? [];
    return entries[0] ?? {};
  }

  private async sendConfirmationSms(phone: string): Promise<void> {
    try {
      const at = this.getAtClient();
      await at.SMS.send({
        to: [phone],
        message: 'Congratulations! Your KSh 100 Tetrasec survey reward has been sent. View your profile at tetrasec.co.ke/surveys',
        from: 'Tetrasec',
      });
    } catch (err) {
      this.logger.warn(`Confirmation SMS failed for ${phone.slice(-4)}: ${err.message}`);
    }
  }

  private getAtClient(): any {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('africastalking')({
      username: this.config.get('at.username'),
      apiKey: this.config.get('at.apiKey'),
    });
  }
}
