import type { BrandProject, EvidenceItem, OpportunityScore, VisibilityOpportunity } from "../types";

const intentTerms = ["best", "alternative", "for", "workflow", "compare", "with", "replace"];

const severityWeight: Record<VisibilityOpportunity["gapType"], number> = {
  missing_brand: 92,
  competitor_dominates: 88,
  missing_source: 76,
  wrong_positioning: 72,
  negative_sentiment: 68,
};

const impactWeight: Record<VisibilityOpportunity["estimatedImpact"], number> = {
  high: 95,
  medium: 72,
  low: 45,
};

export function scoreOpportunity(
  project: BrandProject,
  opportunity: VisibilityOpportunity,
  evidence: EvidenceItem[],
): OpportunityScore {
  const prompt = opportunity.prompt.toLowerCase();
  const intentScore = Math.min(
    100,
    42 + intentTerms.filter((term) => prompt.includes(term)).length * 9 + impactWeight[opportunity.estimatedImpact] * 0.18,
  );
  const competitorMentions = opportunity.competitorMentions.reduce((sum, item) => sum + item.mentions, 0);
  const competitorGapScore = Math.min(100, 40 + competitorMentions * 3.5 + (100 - opportunity.brandVisibilityScore) * 0.25);
  const evidenceScore = Math.min(100, 35 + evidence.length * 18 + evidence.filter((item) => item.riskLevel === "low").length * 8);
  const videoPotentialScore = Math.min(
    100,
    severityWeight[opportunity.gapType] * 0.55 + (prompt.includes("best") ? 24 : 12) + (prompt.includes("workflow") ? 16 : 8),
  );
  const brandTerms = `${project.positioning} ${project.targetAudience}`.toLowerCase().split(/\W+/);
  const overlap = brandTerms.filter((term) => term.length > 5 && prompt.includes(term)).length;
  const brandFitScore = Math.min(100, 58 + overlap * 9 + (opportunity.brandVisibilityScore < 40 ? 10 : 0));
  const total = Math.round(
    intentScore * 0.3 +
      competitorGapScore * 0.25 +
      evidenceScore * 0.2 +
      videoPotentialScore * 0.15 +
      brandFitScore * 0.1,
  );

  return {
    total,
    intentScore: Math.round(intentScore),
    competitorGapScore: Math.round(competitorGapScore),
    evidenceScore: Math.round(evidenceScore),
    videoPotentialScore: Math.round(videoPotentialScore),
    brandFitScore: Math.round(brandFitScore),
    reason: buildScoreReason(opportunity, evidence.length, total),
  };
}

function buildScoreReason(opportunity: VisibilityOpportunity, evidenceCount: number, total: number) {
  if (total >= 85) {
    return `High-intent prompt, strong incumbent dominance, and ${evidenceCount} usable proof points make this the best video gap.`;
  }

  if (opportunity.estimatedImpact === "high") {
    return `The prompt has strong commercial intent, but the campaign needs a tighter source pack before it is judge-ready.`;
  }

  return `Useful visibility gap with enough evidence for a follow-up campaign after the highest-impact prompt.`;
}
