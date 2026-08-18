import type { Tier } from "./classification";
import type { DomainId } from "./domains";

export interface ToolRecommendationLike {
  domainId: string;
  tier: Tier | null;
  setupComplexity: "none" | "low" | "moderate";
}

const SETUP_RANK: Record<ToolRecommendationLike["setupComplexity"], number> = {
  none: 0,
  low: 1,
  moderate: 2,
};

/**
 * Matches tool recommendations to a domain + tier. A null `tier` on a recommendation means it
 * applies to all tiers. Results are ordered by setup complexity ascending, so a Tier A user sees
 * zero-setup options first rather than being pointed at something that needs technical setup.
 */
export function matchTools<T extends ToolRecommendationLike>(
  all: T[],
  domainId: DomainId,
  tier: Tier,
  limit = 3,
): T[] {
  return all
    .filter((t) => t.domainId === domainId && (t.tier === null || t.tier === tier))
    .sort((a, b) => SETUP_RANK[a.setupComplexity] - SETUP_RANK[b.setupComplexity])
    .slice(0, limit);
}
