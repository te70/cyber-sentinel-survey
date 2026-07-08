import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PayoutService } from './payout.service';
import { Submission } from '../entities/submission.entity';
import { PayoutLog } from '../entities/payout-log.entity';

const PRODUCTION_ENV = 'production';

const mockSubRepo = {
  findOne: jest.fn(),
  save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
  find: jest.fn(),
};
const mockPayoutLogRepo = {
  create: jest.fn().mockImplementation((d) => d),
  save: jest.fn().mockResolvedValue(undefined),
};
const mockConfig = {
  get: jest.fn().mockImplementation((k: string) => ({
    'payout.holdHours': 48,
    'payout.amountKes': 100,
    'at.username': 'sandbox',
    'at.apiKey': 'test-key',
  }[k])),
};

const makeValidSub = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub-1',
  phoneVerified: true,
  phoneE164: '+254701234567',
  fraudStatus: 'auto_passed',
  mpesaPayoutStatus: 'queued',
  payoutQueuedAt: new Date(Date.now() - 50 * 3600_000),  // 50h ago — past 48h hold
  ...overrides,
});

describe('PayoutService', () => {
  let service: PayoutService;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutService,
        { provide: getRepositoryToken(Submission), useValue: mockSubRepo },
        { provide: getRepositoryToken(PayoutLog), useValue: mockPayoutLogRepo },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<PayoutService>(PayoutService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  // ── Production guard ───────────────────────────────────────────────────────

  it('throws immediately in non-production environments', async () => {
    process.env.NODE_ENV = 'development';
    const sub = makeValidSub();
    await expect(service.sendMpesaPayout(sub as any)).rejects.toThrow(/production/);
  });

  it('throws immediately in test environments', async () => {
    process.env.NODE_ENV = 'test';
    await expect(service.sendMpesaPayout(makeValidSub() as any)).rejects.toThrow(/production/);
  });

  // ── 48-hour hold ──────────────────────────────────────────────────────────

  it('rejects payouts queued less than 48 hours ago', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub = makeValidSub({ payoutQueuedAt: new Date(Date.now() - 10 * 3600_000) });  // only 10h ago
    await expect(service.sendMpesaPayout(sub as any)).rejects.toThrow(/hold period/);
  });

  it('allows payout exactly at the 48-hour boundary', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub = makeValidSub({ payoutQueuedAt: new Date(Date.now() - 48 * 3600_000 - 1000) });
    jest.spyOn(service as any, 'callAtMpesa').mockResolvedValue({ transactionId: 'TXN123' });
    await expect(service.sendMpesaPayout(sub as any)).resolves.not.toThrow();
  });

  // ── Precondition checks ───────────────────────────────────────────────────

  it('rejects if phone is not verified', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub = makeValidSub({ phoneVerified: false });
    await expect(service.sendMpesaPayout(sub as any)).rejects.toThrow(/not verified/);
  });

  it('rejects if fraud status is not in the allowed set', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub = makeValidSub({ fraudStatus: 'in_review' });
    await expect(service.sendMpesaPayout(sub as any)).rejects.toThrow(/fraud status/);
  });

  it('rejects if mpesaPayoutStatus is not queued', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub = makeValidSub({ mpesaPayoutStatus: 'sent' });
    await expect(service.sendMpesaPayout(sub as any)).rejects.toThrow(/already processed/);
  });

  it('rejects if payoutQueuedAt is null', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub = makeValidSub({ payoutQueuedAt: null });
    await expect(service.sendMpesaPayout(sub as any)).rejects.toThrow();
  });

  // ── Payout target ─────────────────────────────────────────────────────────

  it('always pays to phoneE164, never any other field', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub = makeValidSub({
      phoneE164: '+254701111111',
      email: 'fraud@evil.com',
      businessName: 'Evil Corp',
    });

    let calledPhone: string | undefined;
    jest.spyOn(service as any, 'callAtMpesa').mockImplementation(({ phone }) => {
      calledPhone = phone;
      return Promise.resolve({ transactionId: 'TX999' });
    });

    await service.sendMpesaPayout(sub as any);
    expect(calledPhone).toBe('+254701111111');
  });

  // ── queuePayout ───────────────────────────────────────────────────────────

  it('sets mpesaPayoutStatus to queued and records payoutQueuedAt', async () => {
    const sub = makeValidSub({ mpesaPayoutStatus: 'none', payoutQueuedAt: null });
    mockSubRepo.findOne.mockResolvedValue(sub);
    await service.queuePayout('sub-1');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.mpesaPayoutStatus).toBe('queued');
    expect(saved.payoutQueuedAt).toBeInstanceOf(Date);
  });

  it('does not double-queue if already queued', async () => {
    const sub = makeValidSub({ mpesaPayoutStatus: 'queued' });
    mockSubRepo.findOne.mockResolvedValue(sub);
    await service.queuePayout('sub-1');
    expect(mockSubRepo.save).not.toHaveBeenCalled();
  });

  // ── releaseDuePayouts ─────────────────────────────────────────────────────

  it('skips and returns early in non-production environments', async () => {
    process.env.NODE_ENV = 'development';
    await service.releaseDuePayouts();
    expect(mockSubRepo.find).not.toHaveBeenCalled();
  });

  it('calls sendMpesaPayout for each queued submission past the hold period', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub1 = makeValidSub({ id: 'a' });
    const sub2 = makeValidSub({ id: 'b' });
    mockSubRepo.find.mockResolvedValue([sub1, sub2]);

    const spy = jest.spyOn(service, 'sendMpesaPayout').mockResolvedValue(undefined as any);
    await service.releaseDuePayouts();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not abort remaining payouts if one sendMpesaPayout throws', async () => {
    process.env.NODE_ENV = PRODUCTION_ENV;
    const sub1 = makeValidSub({ id: 'ok' });
    const sub2 = makeValidSub({ id: 'fail' });
    mockSubRepo.find.mockResolvedValue([sub1, sub2]);

    const spy = jest.spyOn(service, 'sendMpesaPayout')
      .mockResolvedValueOnce(undefined as any)
      .mockRejectedValueOnce(new Error('AT error'));

    await expect(service.releaseDuePayouts()).resolves.not.toThrow();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
