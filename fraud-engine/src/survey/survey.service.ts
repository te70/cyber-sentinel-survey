import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash } from 'crypto';
import { Submission } from '../entities/submission.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { OtpService } from '../otp/otp.service';
import { InstantChecksService } from '../instant-checks/instant-checks.service';
import { SIGNAL_WEIGHTS } from '../common/signals.constants';
import { SubmitSurveyDto } from './dto/submit-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(FraudEvent)
    private readonly eventRepo: Repository<FraudEvent>,
    private readonly otpService: OtpService,
    private readonly instantChecks: InstantChecksService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async submit(dto: SubmitSurveyDto, ipAddress: string, userAgent: string): Promise<Record<string, any>> {
    const session = this.otpService.decodeSession(dto.sessionToken);
    if (!session?.phoneVerified) throw new UnauthorizedException('Phone verification required');

    const phone: string = session.phone;
    const phoneHash = createHash('sha256').update(phone).digest('hex');

    const surveyStartedAt = session.surveyStartedAt ? new Date(session.surveyStartedAt) : undefined;

    const sub = this.subRepo.create({
      phoneHash,
      phoneE164: phone,
      phoneVerified: true,
      email: dto.email,
      businessName: dto.businessName,
      websiteUrl: dto.websiteUrl,
      deviceHash: dto.deviceHash,
      ipAddress,
      userAgent,
      surveyStartedAt,
      sectionA: dto.sectionA,
      sectionB: dto.sectionB,
      sectionC: dto.sectionC,
      sectionD: dto.sectionD,
      fraudStatus: 'pending',
      screenedIn: true,
    });
    await this.subRepo.save(sub);

    // Log Layer 1 signal
    await this.eventRepo.save(this.eventRepo.create({
      submissionId: sub.id,
      layer: 1,
      eventType: 'phone_verified',
      detail: { phoneSuffix: phone.slice(-4) },
      scoreImpact: SIGNAL_WEIGHTS['phone_verified'],
    }));

    const { hardBlocked } = await this.instantChecks.run(sub, session);

    if (hardBlocked) {
      sub.fraudStatus = 'auto_rejected';
      sub.fraudScore = 0;
      await this.subRepo.save(sub);
      return { ok: false, submissionId: sub.id, status: 'rejected' };
    }

    // Trigger async Layer 3 enrichment + final scoring
    this.eventEmitter.emit('submission.created', { submissionId: sub.id });

    return { ok: true, submissionId: sub.id, status: 'processing' };
  }
}
