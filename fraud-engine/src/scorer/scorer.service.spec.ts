import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ScorerService } from './scorer.service';
import { Submission } from '../entities/submission.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { PayoutService } from '../payout/payout.service';

const makeEvent = (eventType: string, scoreImpact: number) => ({ eventType, scoreImpact, layer: 'test' }) as unknown as FraudEvent;

const mockSubRepo = {
  findOne: jest.fn(),
  save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
};
const mockEventRepo = { find: jest.fn() };
const mockPayoutService = { queuePayout: jest.fn().mockResolvedValue(undefined) };
const mockConfig = { get: jest.fn().mockReturnValue(60) };  // base score = 60

describe('ScorerService', () => {
  let service: ScorerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScorerService,
        { provide: getRepositoryToken(Submission), useValue: mockSubRepo },
        { provide: getRepositoryToken(FraudEvent), useValue: mockEventRepo },
        { provide: PayoutService, useValue: mockPayoutService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<ScorerService>(ScorerService);
    jest.clearAllMocks();
  });

  // ── route() ───────────────────────────────────────────────────────────────

  it('returns auto_passed for score >= 70 with no hard-block events', () => {
    expect(service.route(85, [])).toBe('auto_passed');
  });

  it('returns in_review for score between 40 and 69', () => {
    expect(service.route(55, [])).toBe('in_review');
  });

  it('returns auto_rejected for score < 40', () => {
    expect(service.route(25, [])).toBe('auto_rejected');
  });

  it('returns auto_rejected for a hard-block event even with score >= 70', () => {
    const events = [makeEvent('duplicate_phone', -100)];
    expect(service.route(90, events)).toBe('auto_rejected');
  });

  it('returns auto_rejected for survey_time_under_2min regardless of score', () => {
    const events = [makeEvent('survey_time_under_2min', -100)];
    expect(service.route(99, events)).toBe('auto_rejected');
  });

  it('returns auto_rejected for bulk_ip_hard_block regardless of score', () => {
    const events = [makeEvent('bulk_ip_hard_block', -100)];
    expect(service.route(100, events)).toBe('auto_rejected');
  });

  // ── computeFraudScore() ───────────────────────────────────────────────────

  it('clamps final score to 100', async () => {
    mockSubRepo.findOne.mockResolvedValue({ id: 'x', fraudStatus: 'pending' });
    mockEventRepo.find.mockResolvedValue([
      makeEvent('phone_verified', 20),
      makeEvent('website_live', 15),
      makeEvent('email_matches_website', 15),
      makeEvent('custom_domain_email', 10),
      makeEvent('domain_established', 10),
    ]);
    await service.computeFraudScore('x');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.fraudScore).toBe(100);
  });

  it('clamps final score to 0 on catastrophic signal stack', async () => {
    mockSubRepo.findOne.mockResolvedValue({ id: 'y', fraudStatus: 'pending' });
    mockEventRepo.find.mockResolvedValue([
      makeEvent('duplicate_phone', -100),
      makeEvent('duplicate_device', -25),
      makeEvent('duplicate_email', -30),
    ]);
    await service.computeFraudScore('y');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.fraudScore).toBe(0);
  });

  it('sets status to auto_passed and queues payout for score >= 70', async () => {
    const sub = { id: 'abc', fraudStatus: 'pending' };
    mockSubRepo.findOne.mockResolvedValue(sub);
    mockEventRepo.find.mockResolvedValue([makeEvent('phone_verified', 20)]);  // 80 total
    await service.computeFraudScore('abc');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.fraudStatus).toBe('auto_passed');
    expect(mockPayoutService.queuePayout).toHaveBeenCalledWith('abc');
  });

  it('sets status to in_review and does NOT queue payout', async () => {
    const sub = { id: 'mno', fraudStatus: 'pending' };
    mockSubRepo.findOne.mockResolvedValue(sub);
    mockEventRepo.find.mockResolvedValue([makeEvent('website_unreachable', -15)]);  // 45 total
    await service.computeFraudScore('mno');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.fraudStatus).toBe('in_review');
    expect(mockPayoutService.queuePayout).not.toHaveBeenCalled();
  });

  it('sets status to auto_rejected on hard-block and does NOT queue payout', async () => {
    const sub = { id: 'zzz', fraudStatus: 'pending' };
    mockSubRepo.findOne.mockResolvedValue(sub);
    mockEventRepo.find.mockResolvedValue([makeEvent('duplicate_phone', -100)]);
    await service.computeFraudScore('zzz');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.fraudStatus).toBe('auto_rejected');
    expect(mockPayoutService.queuePayout).not.toHaveBeenCalled();
  });

  it('uses SIGNAL_WEIGHTS lookup before falling back to event.scoreImpact', async () => {
    const sub = { id: 'wt', fraudStatus: 'pending' };
    mockSubRepo.findOne.mockResolvedValue(sub);
    // phone_verified has weight +20 in SIGNAL_WEIGHTS; even if the DB row says +99,
    // the canonical weight should win.
    mockEventRepo.find.mockResolvedValue([{ eventType: 'phone_verified', scoreImpact: 99, layer: 'otp' }]);
    await service.computeFraudScore('wt');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.fraudScore).toBe(80);  // 60 base + 20 canonical weight, NOT +99
  });

  it('falls back to event.scoreImpact for unknown signal types', async () => {
    const sub = { id: 'fb', fraudStatus: 'pending' };
    mockSubRepo.findOne.mockResolvedValue(sub);
    mockEventRepo.find.mockResolvedValue([{ eventType: 'custom_unknown_signal', scoreImpact: -5, layer: 'enrichment' }]);
    await service.computeFraudScore('fb');
    const saved = mockSubRepo.save.mock.calls[0][0];
    expect(saved.fraudScore).toBe(55);  // 60 - 5
  });
});
