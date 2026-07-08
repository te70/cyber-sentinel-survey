import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Submission } from '../entities/submission.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { SIGNAL_WEIGHTS } from '../common/signals.constants';
import { DISPOSABLE_DOMAINS, FREE_MAIL_PROVIDERS } from '../common/disposable-domains.constants';
import { ScorerService } from '../scorer/scorer.service';

const HTTP_TIMEOUT = 5_000;
const WHOIS_TIMEOUT = 10_000;
const SEARCH_TIMEOUT = 8_000;
const searchCache = new Map<string, { signal: string; found: boolean; snippet: string }>();

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(FraudEvent)
    private readonly eventRepo: Repository<FraudEvent>,
    private readonly scorerService: ScorerService,
  ) {}

  @OnEvent('submission.created')
  async handleSubmissionCreated(payload: { submissionId: string }) {
    try {
      await this.run(payload.submissionId);
      await this.scorerService.computeFraudScore(payload.submissionId);
    } catch (err) {
      this.logger.error(`Enrichment/scoring failed for ${payload.submissionId}: ${err.message}`);
    }
  }

  async run(submissionId: string): Promise<void> {
    const sub = await this.subRepo.findOne({ where: { id: submissionId } });
    if (!sub) { this.logger.error(`Submission ${submissionId} not found`); return; }

    const enrichment: Record<string, any> = {};
    enrichment.website = await this.checkWebsite(sub.id, sub.websiteUrl);
    enrichment.domain  = await this.checkDomainAge(sub.id, sub.websiteUrl);
    enrichment.email   = await this.checkEmailDomain(sub.id, sub.email, sub.websiteUrl);
    enrichment.search  = await this.checkSearchPresence(sub.id, sub.businessName);

    sub.fraudSignals = { ...(sub.fraudSignals ?? {}), enrichment };
    await this.subRepo.save(sub);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async logEvent(submissionId: string, layer: number, eventType: string, detail: Record<string, any>) {
    const impact = SIGNAL_WEIGHTS[eventType] ?? 0;
    await this.eventRepo.save(this.eventRepo.create({ submissionId, layer, eventType, detail, scoreImpact: impact }));
  }

  // ── 3a. Website ping ───────────────────────────────────────────────────────

  private async checkWebsite(submissionId: string, url: string | null): Promise<Record<string, any>> {
    if (!url) {
      await this.logEvent(submissionId, 3, 'no_website_provided', {});
      return { signal: 'no_website_provided' };
    }
    try {
      const resp = await axios.get(url, { timeout: HTTP_TIMEOUT, maxRedirects: 3, validateStatus: () => true });
      const bodyLength = JSON.stringify(resp.data ?? '').length;
      let eventType: string;
      if (resp.status === 200 && bodyLength < 500) eventType = 'website_live_empty';
      else if (resp.status === 200)                eventType = 'website_live';
      else if ([301, 302, 307, 308].includes(resp.status)) eventType = 'website_redirects';
      else if (resp.status === 404)                eventType = 'website_404';
      else if (resp.status >= 500)                 eventType = 'website_server_error';
      else                                         eventType = 'website_live';

      await this.logEvent(submissionId, 3, eventType, { statusCode: resp.status, url });
      return { signal: eventType, statusCode: resp.status };
    } catch (err) {
      const eventType = err.code === 'ECONNREFUSED' ? 'website_refused' : 'website_unreachable';
      await this.logEvent(submissionId, 3, eventType, { url });
      return { signal: eventType };
    }
  }

  // ── 3b. Domain age ─────────────────────────────────────────────────────────

  private extractDomain(url: string): string | null {
    try {
      const { hostname } = new URL(url);
      return hostname.toLowerCase().replace(/^www\./, '');
    } catch { return null; }
  }

  private async checkDomainAge(submissionId: string, url: string | null): Promise<Record<string, any>> {
    if (!url) return { signal: 'no_website_provided' };
    const domain = this.extractDomain(url);
    if (!domain) return { signal: 'domain_whois_unavailable' };

    try {
      const data = await this.whoisLookup(domain);
      const createdAt = this.parseWhoisDate(data);
      if (!createdAt) throw new Error('no creation date');

      const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
      let eventType: string;
      if (ageDays > 730)      eventType = 'domain_established';
      else if (ageDays >= 365) eventType = 'domain_mature';
      else if (ageDays >= 90)  eventType = 'domain_young';
      else if (ageDays >= 30)  eventType = 'domain_very_young';
      else                     eventType = 'domain_brand_new';

      await this.logEvent(submissionId, 3, eventType, { domain, ageDays });
      return { signal: eventType, ageDays };
    } catch {
      await this.logEvent(submissionId, 3, 'domain_whois_unavailable', { domain });
      return { signal: 'domain_whois_unavailable' };
    }
  }

  private whoisLookup(domain: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const whois = require('whois');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WHOIS timeout')), WHOIS_TIMEOUT);
      whois.lookup(domain, (err: Error, data: string) => {
        clearTimeout(timer);
        if (err) reject(err); else resolve(data);
      });
    });
  }

  private parseWhoisDate(data: string): Date | null {
    const patterns = [
      /creation date:\s*(.+)/i,
      /created:\s*(.+)/i,
      /registered:\s*(.+)/i,
      /domain create date:\s*(.+)/i,
    ];
    for (const re of patterns) {
      const m = data.match(re);
      if (m?.[1]) {
        const d = new Date(m[1].trim());
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  }

  // ── 3c. Email domain ───────────────────────────────────────────────────────

  private async checkEmailDomain(submissionId: string, email: string | null, websiteUrl: string | null): Promise<Record<string, any>> {
    if (!email?.includes('@')) return {};
    const emailDomain = email.split('@').pop()!.toLowerCase();
    const websiteDomain = websiteUrl ? this.extractDomain(websiteUrl) : null;

    if (DISPOSABLE_DOMAINS.has(emailDomain)) {
      await this.logEvent(submissionId, 3, 'disposable_email_enrichment', { domain: emailDomain });
      return { signal: 'disposable_email_enrichment' };
    }

    const signals: string[] = [];
    if (websiteDomain && emailDomain === websiteDomain) {
      await this.logEvent(submissionId, 3, 'email_matches_website', { emailDomain, siteDomain: websiteDomain });
      signals.push('email_matches_website');
    }

    const domainType = FREE_MAIL_PROVIDERS.has(emailDomain) ? 'free_email_provider' : 'custom_domain_email';
    await this.logEvent(submissionId, 3, domainType, { domain: emailDomain });
    signals.push(domainType);

    return { signals, domain: emailDomain };
  }

  // ── 3d. Search presence ────────────────────────────────────────────────────

  private async checkSearchPresence(submissionId: string, businessName: string | null): Promise<Record<string, any>> {
    if (!businessName) return {};

    const cacheKey = Buffer.from(businessName.toLowerCase()).toString('base64');
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!;
      await this.logEvent(submissionId, 3, cached.signal, { businessName, cached: true });
      return cached;
    }

    try {
      const q = encodeURIComponent(`${businessName} Kenya`);
      const resp = await axios.get(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1`, {
        timeout: SEARCH_TIMEOUT,
        headers: { 'User-Agent': 'TetrasecFraudEngine/1.0' },
      });
      const { AbstractText: abstract = '', RelatedTopics: topics = [] } = resp.data;
      let signal: string;
      if (abstract || topics.length) {
        signal = /kenya/i.test(abstract) ? 'kenya_context_confirmed' : 'google_presence_found';
      } else {
        signal = 'no_search_presence';
      }
      const result = { signal, found: !!(abstract || topics.length), snippet: String(abstract).slice(0, 200) };
      searchCache.set(cacheKey, result);
      await this.logEvent(submissionId, 3, signal, { businessName });
      return result;
    } catch {
      this.logger.warn(`Search presence check failed for: ${businessName.slice(0, 20)}`);
      return { signal: 'no_search_presence', error: 'lookup_failed' };
    }
  }
}
