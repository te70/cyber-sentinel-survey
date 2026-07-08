import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import { OtpAttempt } from '../entities/otp-attempt.entity';

const OTP_MAX_REQUESTS_PER_HOUR = 3;
const OTP_TTL_MINUTES = 10;
const OTP_MAX_WRONG_ATTEMPTS = 5;
const KENYAN_PHONE_RE = /^\+2547[0-9]{8}$/;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(OtpAttempt)
    private readonly otpRepo: Repository<OtpAttempt>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(phone: string, ipAddress: string): Promise<{ sent: boolean; maskedPhone?: string; error?: string }> {
    if (!KENYAN_PHONE_RE.test(phone)) {
      return { sent: false, error: 'Phone must be a Kenyan mobile number (+2547XXXXXXXX)' };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.otpRepo.count({
      where: { phone, createdAt: MoreThan(oneHourAgo) },
    });

    if (recentCount >= OTP_MAX_REQUESTS_PER_HOUR) {
      return { sent: false, error: 'Too many requests. Try again in 1 hour.' };
    }

    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const attempt = this.otpRepo.create({
      phone,
      code: this.hashCode(code),
      expiresAt,
      ipAddress,
    });
    await this.otpRepo.save(attempt);

    try {
      await this.sendSms(phone, `Your Tetrasec verification code is ${code}. Valid for 10 minutes.`);
    } catch (err) {
      this.logger.error(`SMS send failed for ${phone.slice(-4)}: ${err.message}`);
      await this.otpRepo.remove(attempt);
      return { sent: false, error: 'Failed to send SMS. Please try again.' };
    }

    return { sent: true, maskedPhone: this.maskPhone(phone) };
  }

  async verifyOtp(phone: string, code: string): Promise<{ verified: boolean; sessionToken?: string; error?: string }> {
    const attempt = await this.otpRepo.findOne({
      where: { phone, verified: false },
      order: { createdAt: 'DESC' },
    });

    if (!attempt) {
      return { verified: false, error: 'No pending OTP found. Please request a new code.' };
    }

    if (new Date() > attempt.expiresAt) {
      return { verified: false, error: 'Code expired. Request a new one.' };
    }

    attempt.attempts += 1;
    await this.otpRepo.save(attempt);

    if (attempt.attempts > OTP_MAX_WRONG_ATTEMPTS) {
      return { verified: false, error: 'Too many attempts. Request a new code.' };
    }

    if (this.hashCode(code) !== attempt.code) {
      return { verified: false, error: "That code doesn't match. Check your SMS and try again." };
    }

    attempt.verified = true;
    await this.otpRepo.save(attempt);

    const ttlHours = this.config.get<number>('otp.sessionTtlHours');
    const sessionToken = this.jwtService.sign(
      {
        phoneVerified: true,
        phone,
        surveyStartedAt: new Date().toISOString(),
      },
      { expiresIn: `${ttlHours}h` },
    );

    return { verified: true, sessionToken };
  }

  decodeSession(token: string): Record<string, any> | null {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }

  hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private maskPhone(phone: string): string {
    if (phone.length < 13) return phone.slice(0, 4) + 'XXXXXX';
    return phone.slice(0, 8) + 'XXXXX' + phone.slice(13);
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AT = require('africastalking');
    const at = AT({ username: this.config.get('at.username'), apiKey: this.config.get('at.apiKey') });
    await at.SMS.send({ to: [phone], message, from: 'Tetrasec' });
  }
}
