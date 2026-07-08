import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { OtpAttempt } from '../entities/otp-attempt.entity';

const mockOtpRepo = () => ({
  count: jest.fn(),
  create: jest.fn().mockImplementation((d) => d),
  save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
  remove: jest.fn().mockResolvedValue(undefined),
  findOne: jest.fn(),
});

const mockJwt = { sign: jest.fn().mockReturnValue('signed-token'), verify: jest.fn() };
const mockConfig = { get: jest.fn().mockImplementation((k) => ({ 'otp.sessionTtlHours': 4, 'at.username': 'u', 'at.apiKey': 'k' }[k])) };

describe('OtpService', () => {
  let service: OtpService;
  let otpRepo: ReturnType<typeof mockOtpRepo>;

  beforeEach(async () => {
    otpRepo = mockOtpRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: getRepositoryToken(OtpAttempt), useValue: otpRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<OtpService>(OtpService);
  });

  // ── sendOtp ──────────────────────────────────────────────────────────────

  it('accepts a valid Kenyan phone number', async () => {
    otpRepo.count.mockResolvedValue(0);
    jest.spyOn(service as any, 'sendSms').mockResolvedValue(undefined);
    const result = await service.sendOtp('+254701234567', '1.2.3.4');
    expect(result.sent).toBe(true);
    expect(result.maskedPhone).toBeDefined();
  });

  it('rejects a non-Kenyan phone number', async () => {
    const result = await service.sendOtp('+12125551234', '1.2.3.4');
    expect(result.sent).toBe(false);
    expect(result.error).toMatch(/Kenyan/);
  });

  it('rejects a phone without +254 prefix', async () => {
    const result = await service.sendOtp('0701234567', '1.2.3.4');
    expect(result.sent).toBe(false);
  });

  it('rate-limits the 4th request in 1 hour', async () => {
    otpRepo.count.mockResolvedValue(3);  // already 3 recent requests
    const result = await service.sendOtp('+254701234567', '1.2.3.4');
    expect(result.sent).toBe(false);
    expect(result.error).toMatch(/Too many/);
  });

  it('stores the OTP as a SHA-256 hash, not plain text', async () => {
    otpRepo.count.mockResolvedValue(0);
    jest.spyOn(service as any, 'sendSms').mockResolvedValue(undefined);

    let savedAttempt: any;
    otpRepo.save.mockImplementation((d) => { savedAttempt = d; return Promise.resolve(d); });

    await service.sendOtp('+254701234567', '1.2.3.4');

    expect(savedAttempt).toBeDefined();
    expect(savedAttempt.code).toHaveLength(64);   // SHA-256 hex = 64 chars
    expect(savedAttempt.code).not.toMatch(/^\d{6}$/);  // definitely not the raw 6-digit code
  });

  it('rolls back the OTP attempt if SMS send fails', async () => {
    otpRepo.count.mockResolvedValue(0);
    jest.spyOn(service as any, 'sendSms').mockRejectedValue(new Error('SMS error'));
    const result = await service.sendOtp('+254701234567', '1.2.3.4');
    expect(result.sent).toBe(false);
    expect(otpRepo.remove).toHaveBeenCalled();
  });

  // ── verifyOtp ─────────────────────────────────────────────────────────────

  it('verifies a correct, unexpired OTP and returns a session token', async () => {
    const code = '123456';
    const hashed = service.hashCode(code);
    otpRepo.findOne.mockResolvedValue({
      phone: '+254701234567', code: hashed, verified: false, attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await service.verifyOtp('+254701234567', code);
    expect(result.verified).toBe(true);
    expect(result.sessionToken).toBe('signed-token');
  });

  it('rejects an expired OTP', async () => {
    otpRepo.findOne.mockResolvedValue({
      phone: '+254701234567', code: service.hashCode('123456'), verified: false,
      attempts: 0, expiresAt: new Date(Date.now() - 1000),
    });
    const result = await service.verifyOtp('+254701234567', '123456');
    expect(result.verified).toBe(false);
    expect(result.error).toMatch(/expired/i);
  });

  it('rejects a wrong code and increments attempts', async () => {
    const attempt = {
      phone: '+254701234567', code: service.hashCode('999999'), verified: false,
      attempts: 0, expiresAt: new Date(Date.now() + 60_000),
    };
    otpRepo.findOne.mockResolvedValue(attempt);
    const result = await service.verifyOtp('+254701234567', '000000');
    expect(result.verified).toBe(false);
    expect(attempt.attempts).toBe(1);
  });

  it('locks after 5 wrong attempts', async () => {
    const attempt = {
      phone: '+254701234567', code: service.hashCode('999999'), verified: false,
      attempts: 5, expiresAt: new Date(Date.now() + 60_000),
    };
    otpRepo.findOne.mockResolvedValue(attempt);
    const result = await service.verifyOtp('+254701234567', '000000');
    expect(result.verified).toBe(false);
    expect(result.error).toMatch(/Too many/);
  });

  it('returns an error if no pending OTP exists', async () => {
    otpRepo.findOne.mockResolvedValue(null);
    const result = await service.verifyOtp('+254701234567', '123456');
    expect(result.verified).toBe(false);
  });

  // ── hashCode ──────────────────────────────────────────────────────────────

  it('produces a deterministic 64-char hex hash', () => {
    const h1 = service.hashCode('123456');
    const h2 = service.hashCode('123456');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it('produces different hashes for different codes', () => {
    expect(service.hashCode('111111')).not.toBe(service.hashCode('222222'));
  });
});
