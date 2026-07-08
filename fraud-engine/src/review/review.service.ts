import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../entities/submission.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { PayoutService } from '../payout/payout.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(FraudEvent)
    private readonly eventRepo: Repository<FraudEvent>,
    private readonly payoutService: PayoutService,
  ) {}

  async getQueue(page = 1, perPage = 50) {
    const [rows, total] = await this.subRepo.findAndCount({
      where: { fraudStatus: 'in_review' },
      order: { fraudScore: 'ASC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return {
      page,
      perPage,
      total,
      results: await Promise.all(rows.map(s => this.summarise(s))),
    };
  }

  async approve(submissionId: string, note: string, adminUser = 'admin') {
    const sub = await this.getReviewable(submissionId);
    sub.fraudStatus = 'approved';
    sub.reviewedBy = adminUser;
    sub.reviewedAt = new Date();
    sub.reviewNote = note;
    await this.subRepo.save(sub);
    await this.payoutService.queuePayout(submissionId);
    return { status: 'approved', payout: 'queued' };
  }

  async reject(submissionId: string, note: string, adminUser = 'admin') {
    const sub = await this.getReviewable(submissionId);
    sub.fraudStatus = 'rejected';
    sub.reviewedBy = adminUser;
    sub.reviewedAt = new Date();
    sub.reviewNote = note;
    await this.subRepo.save(sub);
    return { status: 'rejected' };
  }

  async escalate(submissionId: string, note: string, adminUser = 'admin') {
    const sub = await this.getReviewable(submissionId);
    sub.fraudSignals = { ...(sub.fraudSignals ?? {}), escalated: true, escalationNote: note };
    sub.reviewedBy = adminUser;
    sub.reviewedAt = new Date();
    await this.subRepo.save(sub);
    return { status: 'escalated' };
  }

  private async getReviewable(id: string): Promise<Submission> {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');
    if (!['in_review', 'approved', 'rejected'].includes(sub.fraudStatus)) {
      throw new ConflictException(`Submission status is '${sub.fraudStatus}'`);
    }
    return sub;
  }

  private async summarise(sub: Submission) {
    const events = await this.eventRepo.find({ where: { submissionId: sub.id } });
    return {
      id: sub.id,
      createdAt: sub.createdAt?.toISOString(),
      businessName: sub.businessName,
      email: sub.email,
      websiteUrl: sub.websiteUrl,
      fraudScore: sub.fraudScore,
      fraudStatus: sub.fraudStatus,
      payoutStatus: sub.mpesaPayoutStatus,
      reviewHistory: { reviewedBy: sub.reviewedBy, reviewedAt: sub.reviewedAt?.toISOString(), note: sub.reviewNote },
      signals: events.map(e => ({ type: e.eventType, layer: e.layer, impact: e.scoreImpact, detail: e.detail })),
    };
  }
}
