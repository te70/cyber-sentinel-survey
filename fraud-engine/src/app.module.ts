import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import configuration from './config/configuration';
import { Submission } from './entities/submission.entity';
import { OtpAttempt } from './entities/otp-attempt.entity';
import { FraudEvent } from './entities/fraud-event.entity';
import { PayoutLog } from './entities/payout-log.entity';
import { OtpService } from './otp/otp.service';
import { OtpController } from './otp/otp.controller';
import { InstantChecksService } from './instant-checks/instant-checks.service';
import { EnrichmentService } from './enrichment/enrichment.service';
import { ScorerService } from './scorer/scorer.service';
import { PayoutService } from './payout/payout.service';
import { PayoutScheduler } from './payout/payout.scheduler';
import { ReviewService } from './review/review.service';
import { ReviewController } from './review/review.controller';
import { SurveyService } from './survey/survey.service';
import { SurveyController } from './survey/survey.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('database.url'),
        entities: [Submission, OtpAttempt, FraudEvent, PayoutLog],
        synchronize: false,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),

    TypeOrmModule.forFeature([Submission, OtpAttempt, FraudEvent, PayoutLog]),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: `${config.get('otp.sessionTtlHours')}h` },
      }),
    }),

    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  providers: [
    OtpService,
    InstantChecksService,
    EnrichmentService,
    ScorerService,
    PayoutService,
    PayoutScheduler,
    ReviewService,
    SurveyService,
  ],
  controllers: [
    OtpController,
    SurveyController,
    ReviewController,
  ],
})
export class AppModule {}
