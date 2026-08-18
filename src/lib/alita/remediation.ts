// Post-assessment remediation planning — pure functions, no HTTP/DB concerns.
// Mirrors scoring.ts's pattern: reuses its constants rather than redefining them.

import { AWARENESS_GATE_THRESHOLD } from "./scoring";
import { DOMAIN_IDS, type DomainId } from "./domains";

// Used as the effective target level when the SME hasn't completed a Target Profile yet — the
// floor of the "Defined" band (Section 5). Named constant, same provisional-value treatment as
// the gate threshold/cap: a defensible starting point, not a settled finding.
export const DEFAULT_TARGET_LEVEL = 3;

export type Priority = "High" | "Medium" | "Low";

export interface RemediationPlanEntry {
  domainId: DomainId;
  currentLevel: number;
  effectiveTarget: number;
  priority: Priority;
  gatePinned: boolean;
}

function priorityFor(gapSize: number): Priority {
  return gapSize >= 3 ? "High" : gapSize === 2 ? "Medium" : "Low";
}

const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

/**
 * Builds the ordered list of domains a report/training screen should surface remediation for.
 * Only domains below their effective target are included. D4 is force-pinned to the front
 * whenever the awareness gate is active (D4 < AWARENESS_GATE_THRESHOLD), regardless of its
 * computed priority — the gate mechanism has to be actionable, not just a number the SME has to
 * interpret themselves.
 */
export function buildRemediationPlan(
  currentScores: Record<DomainId, number>,
  targetScores: Partial<Record<DomainId, number>> | null,
): RemediationPlanEntry[] {
  const gateActive = currentScores.D4 < AWARENESS_GATE_THRESHOLD;

  const entries: RemediationPlanEntry[] = DOMAIN_IDS.map((domainId) => {
    const currentLevel = currentScores[domainId];
    let effectiveTarget = targetScores?.[domainId] ?? DEFAULT_TARGET_LEVEL;
    if (domainId === "D4" && gateActive) {
      // Even if a custom target for D4 doesn't clear the gate threshold, force at least one
      // more step so gated SMEs always get D4 guidance, not a domain that's silently excluded.
      effectiveTarget = Math.max(effectiveTarget, currentLevel + 1, AWARENESS_GATE_THRESHOLD);
    }
    const gapSize = effectiveTarget - currentLevel;
    return {
      domainId,
      currentLevel,
      effectiveTarget,
      priority: priorityFor(gapSize),
      gatePinned: domainId === "D4" && gateActive,
    };
  }).filter((e) => e.effectiveTarget > e.currentLevel);

  entries.sort((a, b) => {
    if (a.gatePinned !== b.gatePinned) return a.gatePinned ? -1 : 1;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });

  return entries;
}

/**
 * Adjacent-level step pairs from `fromLevel` to `toLevel` (Phase 5 chaining) — e.g. 1 -> 4
 * becomes [[1,2],[2,3],[3,4]]. Callers show the first pair by default and the rest on expand,
 * rather than dumping the whole multi-level jump on the user at once.
 */
export function buildRemediationChain(
  fromLevel: number,
  toLevel: number,
): { fromLevel: number; toLevel: number }[] {
  const chain: { fromLevel: number; toLevel: number }[] = [];
  for (let level = fromLevel; level < toLevel; level++) {
    chain.push({ fromLevel: level, toLevel: level + 1 });
  }
  return chain;
}
