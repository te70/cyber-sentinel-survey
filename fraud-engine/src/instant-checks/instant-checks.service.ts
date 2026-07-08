import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not, In } from 'typeorm';
import { Submission } from '../entities/submission.entity';
import { FraudEvent } from '../entities/fraud-event.entity';
import { SIGNAL_WEIGHTS, HARD_BLOCK_EVENTS } from '../common/signals.constants';
import { DISPOSABLE_DOMAINS } from '../common/disposable-domains.constants';

const SUSPICIOUS_HOSTS = new Set(['localhost', '127.0.0.1', 'example.com', '0.0.0.0']);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+2547[0-9]{8}$/;

export interface CheckSignal {
  eventType: string;
  layer: number;
  detail: Record<string, any>;
  scoreImpact: number;
  hardBlock: boolean;
}

@Injectable()
export class InstantChecksService {
  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(FraudEvent)
    private readonly eventRepo: Repository<FraudEvent>,
  ) {}

  async run(sub: Submission, sessionData: Record<string, any>): Promise<{ hardBlocked: boolean; signals: string[] }> {
    const signals: string[] = [];
    let hardBlocked = false;
    const now = new Date();

    const log = async (eventType: string, detail: Record<string, any> = {}, layer = 2) => {
      const impact = SIGNAL_WEIGHTS[eventType] ?? 0;
      const event = this.eventRepo.create({ submissionId: sub.id, layer, eventType, detail, scoreImpact: impact });
      await this.eventRepo.save(event);
      signals.push(eventType);
      if (HARD_BLOCK_EVENTS.has(eventType)) hardBlocked = true;
    };

    // ── 2a. Deduplication ────────────────────────────────────────────────────
    if (sub.phoneE164) {
      const dup = await this.subRepo.findOne({
        where: {
          phoneE164: sub.phoneE164,
          fraudStatus: Not(In(['auto_rejected', 'rejected'])),
          id: Not(sub.id),
        },
      });
      if (dup) await log('duplicate_phone', { existingId: dup.id });
    }

    if (sub.email) {
      const dupEmailResult = await this.subRepo
        .createQueryBuilder('s')
        .where('LOWER(s.email) = LOWER(:email)', { email: sub.email })
        .andWhere('s.id != :id', { id: sub.id })
        .getOne();
      if (dupEmailResult) await log('duplicate_email', { existingId: dupEmailResult.id });
    }

    if (sub.deviceHash) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const dupDevice = await this.subRepo.findOne({
        where: {
          deviceHash: sub.deviceHash,
          id: Not(sub.id),
          createdAt: MoreThan(sevenDaysAgo),
        },
      });
      if (dupDevice) await log('duplicate_device', { existingId: dupDevice.id });
    }

    if (sub.businessName) {
      const match = await this.checkBusinessNameFuzzy(sub.businessName, sub.id);
      if (match) await log('duplicate_business_name', match);
    }

    // ── 2b. IP rate limiting ─────────────────────────────────────────────────
    if (sub.ipAddress) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const ipCount = await this.subRepo
        .createQueryBuilder('s')
        .where('s.ip_address = :ip', { ip: sub.ipAddress })
        .andWhere('s.id != :id', { id: sub.id })
        .andWhere('s.created_at > :cutoff', { cutoff: tenMinAgo })
        .getCount();

      if (ipCount >= 5)      await log('bulk_ip_hard_block', { count: ipCount });
      else if (ipCount >= 3) await log('bulk_ip_submission', { count: ipCount });
      else if (ipCount >= 2) await log('mild_ip_cluster', { count: ipCount });
    }

    // ── 2c. Input format validation ──────────────────────────────────────────
    if (sub.phoneE164 && !PHONE_RE.test(sub.phoneE164)) {
      await log('invalid_phone_format', { phone: sub.phoneE164 });
    }

    if (sub.email) {
      const domain = sub.email.includes('@') ? sub.email.split('@').pop()!.toLowerCase() : '';
      if (DISPOSABLE_DOMAINS.has(domain)) await log('disposable_email', { domain });
      else if (!EMAIL_RE.test(sub.email)) await log('invalid_email_format', { email: sub.email });
    }

    if (sub.websiteUrl) {
      const urlIssue = this.checkWebsiteUrl(sub.websiteUrl);
      if (urlIssue) await log('invalid_website_format', urlIssue);
    }

    for (const [sectionKey, sectionData] of [['a', sub.sectionA], ['b', sub.sectionB], ['c', sub.sectionC]] as const) {
      if (!sectionData || typeof sectionData !== 'object' || Object.keys(sectionData).length === 0) {
        await log('missing_required_field', { section: sectionKey, reason: 'section_missing' });
      } else {
        for (const [field, value] of Object.entries(sectionData)) {
          if (value === null || value === undefined) {
            await log('missing_required_field', { section: sectionKey, field });
          }
        }
      }
    }

    for (const [sectionKey, sectionData] of [['b', sub.sectionB], ['c', sub.sectionC], ['d', sub.sectionD]] as const) {
      if (sectionData && typeof sectionData === 'object') {
        for (const [field, value] of Object.entries(sectionData)) {
          if (typeof value === 'number' && (value < 1 || value > 5)) {
            await log('tampered_likert_range', { section: sectionKey, field, value });
            break;
          }
        }
      }
    }

    // ── 2d. Consistency checks ───────────────────────────────────────────────
    const a = sub.sectionA ?? {};
    const { employees, year_started: yearStarted, it_staff: itStaff, sector, digital_platforms: digitalPlatforms } = a;

    if (employees === '50-99' && String(yearStarted) === String(now.getFullYear())) {
      await log('employee_count_year_mismatch', { employees, yearStarted });
    }
    if (employees === '1-9' && itStaff === '10+') {
      await log('impossible_employee_it', { employees, itStaff });
    }
    if (sector === 'agriculture' && !digitalPlatforms) {
      await log('not_digital_business', { sector });
    }

    const surveyStartedAt = sessionData['surveyStartedAt'];
    if (surveyStartedAt) {
      const timeSignal = this.checkCompletionTime(surveyStartedAt, now);
      if (timeSignal) await log(timeSignal[0], timeSignal[1]);
    }

    if (sub.sectionB && typeof sub.sectionB === 'object') {
      const varianceSignal = this.checkLikertVariance(sub.sectionB);
      if (varianceSignal) await log(varianceSignal[0], varianceSignal[1]);
    }

    if (sub.sectionB && sub.sectionC) {
      const confusionSignal = this.checkScaleConfusion(sub.sectionB, sub.sectionC);
      if (confusionSignal) await log(confusionSignal[0], confusionSignal[1]);
    }

    return { hardBlocked, signals };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async checkBusinessNameFuzzy(name: string, currentId: string): Promise<Record<string, any> | null> {
    const recent = await this.subRepo
      .createQueryBuilder('s')
      .select(['s.id', 's.business_name'])
      .where('s.business_name IS NOT NULL')
      .andWhere('s.id != :id', { id: currentId })
      .orderBy('s.created_at', 'DESC')
      .limit(500)
      .getRawMany();

    for (const row of recent) {
      const ratio = this.fuzzyRatio(name.toLowerCase(), (row.s_business_name ?? '').toLowerCase());
      if (ratio > 85) {
        return { matched: row.s_business_name, ratio, existingId: row.s_id };
      }
    }
    return null;
  }

  checkWebsiteUrl(url: string): Record<string, any> | null {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { url, reason: 'missing_scheme' };
    }
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      if (SUSPICIOUS_HOSTS.has(host) || host.startsWith('192.168.') || host.startsWith('10.')) {
        return { url, reason: 'local_or_reserved_host' };
      }
      if (!host.includes('.')) return { url, reason: 'no_valid_tld' };
    } catch {
      return { url, reason: 'parse_error' };
    }
    return null;
  }

  checkCompletionTime(surveyStartedAt: string, now: Date): [string, Record<string, any>] | null {
    const started = new Date(surveyStartedAt);
    if (isNaN(started.getTime())) return null;
    const minutes = (now.getTime() - started.getTime()) / 60_000;
    if (minutes < 2)   return ['survey_time_under_2min', { minutes: +minutes.toFixed(2) }];
    if (minutes < 4)   return ['survey_time_under_4min', { minutes: +minutes.toFixed(2) }];
    if (minutes > 180) return ['survey_time_very_long',  { minutes: +minutes.toFixed(2) }];
    return null;
  }

  checkLikertVariance(sectionB: Record<string, any>): [string, Record<string, any>] | null {
    const values = Object.values(sectionB).filter(v => typeof v === 'number' && v >= 1 && v <= 5) as number[];
    if (values.length < 5) return null;
    const std = this.pstdev(values);
    if (std === 0)    return ['straight_line_response', { stdDev: 0, count: values.length }];
    if (std < 0.3)   return ['near_straight_line', { stdDev: +std.toFixed(3), count: values.length }];
    return null;
  }

  checkScaleConfusion(sectionB: Record<string, any>, sectionC: Record<string, any>): [string, Record<string, any>] | null {
    const bVals = Object.values(sectionB).filter(v => typeof v === 'number' && v >= 1 && v <= 5) as number[];
    const cVals = Object.values(sectionC).filter(v => typeof v === 'number' && v >= 1 && v <= 5) as number[];
    if (!bVals.length || !cVals.length) return null;
    const bMean = bVals.reduce((a, b) => a + b, 0) / bVals.length;
    const cMean = cVals.reduce((a, b) => a + b, 0) / cVals.length;
    if (bMean > 4.5 && cMean > 4.5) {
      return ['scale_confusion_suspected', { bMean: +bMean.toFixed(2), cMean: +cMean.toFixed(2) }];
    }
    return null;
  }

  fuzzyRatio(a: string, b: string): number {
    if (a === b) return 100;
    const longer  = a.length >= b.length ? a : b;
    const shorter = a.length >= b.length ? b : a;
    const dist = this.levenshtein(longer, shorter);
    return Math.round(((longer.length - dist) / longer.length) * 100);
  }

  private levenshtein(s: string, t: string): number {
    const m = s.length, n = t.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = s[i - 1] === t[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  pstdev(values: number[]): number {
    const n = values.length;
    if (n === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n);
  }
}
