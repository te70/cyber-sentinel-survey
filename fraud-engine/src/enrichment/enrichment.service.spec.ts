import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EnrichmentService } from './enrichment.service';
import { Submission } from '../entities/submission.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { ScorerService } from '../scorer/scorer.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSubRepo = { findOne: jest.fn(), save: jest.fn() };
const mockEventRepo = { create: jest.fn().mockImplementation(d => d), save: jest.fn() };
const mockScorerService = { computeFraudScore: jest.fn() };

describe('EnrichmentService', () => {
  let service: EnrichmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichmentService,
        { provide: getRepositoryToken(Submission), useValue: mockSubRepo },
        { provide: getRepositoryToken(FraudEvent), useValue: mockEventRepo },
        { provide: ScorerService, useValue: mockScorerService },
      ],
    }).compile();
    service = module.get<EnrichmentService>(EnrichmentService);
    jest.clearAllMocks();
  });

  // ── Website ping ──────────────────────────────────────────────────────────

  it('logs website_live and +15 impact for HTTP 200 with content', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: 'x'.repeat(1000), headers: {} } as any);
    await (service as any).checkWebsite('sub-id', 'https://acme.co.ke');
    const saved = mockEventRepo.save.mock.calls[0][0];
    expect(saved.eventType).toBe('website_live');
    expect(saved.scoreImpact).toBe(15);
  });

  it('logs website_live_empty for HTTP 200 with tiny body', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: 'hi', headers: {} } as any);
    await (service as any).checkWebsite('sub-id', 'https://tiny.co.ke');
    expect(mockEventRepo.save.mock.calls[0][0].eventType).toBe('website_live_empty');
  });

  it('logs website_unreachable and -15 on timeout', async () => {
    mockedAxios.get.mockRejectedValue({ code: 'ETIMEDOUT', message: 'timeout' });
    await (service as any).checkWebsite('sub-id', 'https://dead.co.ke');
    const saved = mockEventRepo.save.mock.calls[0][0];
    expect(saved.eventType).toBe('website_unreachable');
    expect(saved.scoreImpact).toBe(-15);
  });

  it('logs website_404 and -10 for 404 response', async () => {
    mockedAxios.get.mockResolvedValue({ status: 404, data: '', headers: {} } as any);
    await (service as any).checkWebsite('sub-id', 'https://gone.co.ke');
    expect(mockEventRepo.save.mock.calls[0][0].scoreImpact).toBe(-10);
  });

  it('logs no_website_provided and -5 when URL is null', async () => {
    await (service as any).checkWebsite('sub-id', null);
    const saved = mockEventRepo.save.mock.calls[0][0];
    expect(saved.eventType).toBe('no_website_provided');
    expect(saved.scoreImpact).toBe(-5);
  });

  // ── Domain age ────────────────────────────────────────────────────────────

  it('logs domain_brand_new (-20) for a domain created 10 days ago', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000);
    jest.spyOn(service as any, 'whoisLookup').mockResolvedValue(
      `Creation Date: ${tenDaysAgo.toISOString()}`
    );
    await (service as any).checkDomainAge('sub-id', 'https://brandnew.co.ke');
    expect(mockEventRepo.save.mock.calls[0][0].eventType).toBe('domain_brand_new');
    expect(mockEventRepo.save.mock.calls[0][0].scoreImpact).toBe(-20);
  });

  it('logs domain_established (+10) for a domain > 2 years old', async () => {
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 86_400_000);
    jest.spyOn(service as any, 'whoisLookup').mockResolvedValue(
      `Creation Date: ${threeYearsAgo.toISOString()}`
    );
    await (service as any).checkDomainAge('sub-id', 'https://old.co.ke');
    expect(mockEventRepo.save.mock.calls[0][0].scoreImpact).toBe(10);
  });

  it('logs domain_whois_unavailable (0) on WHOIS failure', async () => {
    jest.spyOn(service as any, 'whoisLookup').mockRejectedValue(new Error('timeout'));
    await (service as any).checkDomainAge('sub-id', 'https://somesite.co.ke');
    expect(mockEventRepo.save.mock.calls[0][0].eventType).toBe('domain_whois_unavailable');
    expect(mockEventRepo.save.mock.calls[0][0].scoreImpact).toBe(0);
  });

  // ── Email domain ──────────────────────────────────────────────────────────

  it('logs email_matches_website (+15) when email domain matches site domain', async () => {
    await (service as any).checkEmailDomain('sub-id', 'john@acme.co.ke', 'https://acme.co.ke');
    const saved = mockEventRepo.save.mock.calls;
    expect(saved.some(c => c[0].eventType === 'email_matches_website' && c[0].scoreImpact === 15)).toBe(true);
  });

  it('logs custom_domain_email (+10) for non-free provider', async () => {
    await (service as any).checkEmailDomain('sub-id', 'john@techfirm.co.ke', null);
    const saved = mockEventRepo.save.mock.calls;
    expect(saved.some(c => c[0].eventType === 'custom_domain_email' && c[0].scoreImpact === 10)).toBe(true);
  });

  it('logs free_email_provider (0) for gmail', async () => {
    await (service as any).checkEmailDomain('sub-id', 'john@gmail.com', null);
    const saved = mockEventRepo.save.mock.calls;
    expect(saved.some(c => c[0].eventType === 'free_email_provider' && c[0].scoreImpact === 0)).toBe(true);
  });

  // ── Search presence ───────────────────────────────────────────────────────

  it('logs no_search_presence (-10) when DuckDuckGo returns empty', async () => {
    mockedAxios.get.mockResolvedValue({ data: { AbstractText: '', RelatedTopics: [] } } as any);
    await (service as any).checkSearchPresence('sub-id', 'Unknown XYZ Corp 999');
    expect(mockEventRepo.save.mock.calls[0][0].eventType).toBe('no_search_presence');
  });

  it('handles search API failure gracefully without throwing', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network'));
    const result = await (service as any).checkSearchPresence('sub-id', 'SomeBiz');
    expect(result.signal).toBe('no_search_presence');
  });
});
