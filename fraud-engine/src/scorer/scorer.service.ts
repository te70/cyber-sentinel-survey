import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../entities/submission.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { SIGNAL_WEIGHTS, SCORE_THRESHOLDS, HARD_BLOCK_EVENTS } from '../common/signals.constants';
import { ConfigService } from '@nestjs/config';
import { PayoutService } from '../payout/payout.service';

@Injectable()
export class ScorerService {
  private readonly logger = new Logger(ScorerService.name);

  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(FraudEvent)
    private readonly eventRepo: Repository<FraudEvent>,
    private readonly config: ConfigService,
    private readonly payoutService: PayoutService,
  ) {}

  async computeFraudScore(submissionId: string): Promise<{ score: number; status: string; signals: string[] }> {
    const sub = await this.subRepo.findOne({ where: { id: submissionId } });
    if (!sub) throw new Error(`Submission ${submissionId} not found`);

    const events = await this.eventRepo.find({ where: { submissionId } });

    const base = this.config.get<number>('fraud.baseScore') ?? 60;
    let score = base;
    for (const event of events) {
      score += SIGNAL_WEIGHTS[event.eventType] ?? event.scoreImpact;
    }
    score = Math.max(0, Math.min(100, score));

    const status = this.route(score, events);

    sub.fraudScore = score;
    sub.fraudStatus = status;
    sub.fraudSignals = { ...(sub.fraudSignals ?? {}), signals: Object.fromEntries(events.map(e => [e.eventType, e.detail])) };
    await this.subRepo.save(sub);

    if (status === 'auto_passed') {
      await this.payoutService.queuePayout(submissionId);
    }

    this.logger.log(`Scored submission ${submissionId} → ${score} (${status})`);
    return { score, status, signals: events.map(e => e.eventType) };
  }

  route(score: number, events: FraudEvent[]): string {
    for (const event of events) {
      if (HARD_BLOCK_EVENTS.has(event.eventType)) return 'auto_rejected';
    }
    if (score >= SCORE_THRESHOLDS.autoPass) return 'auto_passed';
    if (score >= SCORE_THRESHOLDS.review)   return 'in_review';
    return 'auto_rejected';
  }
}
