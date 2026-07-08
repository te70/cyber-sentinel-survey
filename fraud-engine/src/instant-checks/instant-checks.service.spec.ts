import { InstantChecksService } from './instant-checks.service';

// Pure unit tests for helper methods — no NestJS DI needed.
describe('InstantChecksService helpers', () => {
  let service: InstantChecksService;

  beforeEach(() => {
    service = new InstantChecksService(null as any, null as any);
  });

  // ── completion time ───────────────────────────────────────────────────────

  it('flags survey completed in under 2 minutes as hard-block signal', () => {
    const started = new Date(Date.now() - 90_000);  // 90 seconds ago
    const result = service.checkCompletionTime(started.toISOString(), new Date());
    expect(result).not.toBeNull();
    expect(result![0]).toBe('survey_time_under_2min');
  });

  it('flags survey completed in under 4 minutes', () => {
    const started = new Date(Date.now() - 3 * 60_000);
    const result = service.checkCompletionTime(started.toISOString(), new Date());
    expect(result![0]).toBe('survey_time_under_4min');
  });

  it('returns null for a normal completion time', () => {
    const started = new Date(Date.now() - 15 * 60_000);
    expect(service.checkCompletionTime(started.toISOString(), new Date())).toBeNull();
  });

  // ── Likert variance ───────────────────────────────────────────────────────

  it('detects all-same responses as straight_line_response', () => {
    const section = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`q${i}`, 3]));
    const result = service.checkLikertVariance(section);
    expect(result![0]).toBe('straight_line_response');
  });

  it('detects very low variance as near_straight_line', () => {
    const values = [...Array(38).fill(3), 4, 2];
    const section = Object.fromEntries(values.map((v, i) => [`q${i}`, v]));
    const result = service.checkLikertVariance(section);
    expect(['near_straight_line', 'straight_line_response']).toContain(result![0]);
  });

  it('returns null for normally distributed responses', () => {
    const section = Object.fromEntries(
      [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map((v, i) => [`q${i}`, v]),
    );
    expect(service.checkLikertVariance(section)).toBeNull();
  });

  // ── scale confusion ───────────────────────────────────────────────────────

  it('detects both section B and C means above 4.5 as scale confusion', () => {
    const hi = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i}`, 5]));
    const result = service.checkScaleConfusion(hi, hi);
    expect(result![0]).toBe('scale_confusion_suspected');
  });

  it('returns null when only one section is high', () => {
    const hi = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i}`, 5]));
    const lo = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i}`, 2]));
    expect(service.checkScaleConfusion(hi, lo)).toBeNull();
  });

  // ── website URL validation ────────────────────────────────────────────────

  it('flags URLs without http/https scheme', () => {
    expect(service.checkWebsiteUrl('acme.co.ke')?.reason).toBe('missing_scheme');
  });

  it('flags localhost URLs', () => {
    expect(service.checkWebsiteUrl('http://localhost:3000')).not.toBeNull();
  });

  it('passes valid URLs', () => {
    expect(service.checkWebsiteUrl('https://acme.co.ke')).toBeNull();
  });

  // ── fuzzy ratio ───────────────────────────────────────────────────────────

  it('returns 100 for identical strings', () => {
    expect(service.fuzzyRatio('acme digital', 'acme digital')).toBe(100);
  });

  it('returns < 85 for clearly different strings', () => {
    expect(service.fuzzyRatio('acme digital', 'unrelated xyz corp')).toBeLessThan(85);
  });

  it('returns > 70 for near-identical strings', () => {
    expect(service.fuzzyRatio('safaricom kenya', 'safaricom kenya ltd')).toBeGreaterThan(70);
  });

  // ── pstdev ───────────────────────────────────────────────────────────────

  it('returns 0 for a constant array', () => {
    expect(service.pstdev([3, 3, 3, 3])).toBe(0);
  });

  it('returns > 0 for varying values', () => {
    expect(service.pstdev([1, 2, 3, 4, 5])).toBeGreaterThan(0);
  });
});
