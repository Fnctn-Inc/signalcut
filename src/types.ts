export type VisibilitySource = "peec";

export type GapType =
  | "missing_brand"
  | "competitor_dominates"
  | "negative_sentiment"
  | "missing_source"
  | "wrong_positioning";

export type RiskLevel = "low" | "medium" | "high";

export interface BrandProject {
  id: string;
  brandName: string;
  websiteUrl: string;
  competitors: string[];
  targetAudience: string;
  positioning: string;
}

export interface VisibilityOpportunity {
  id: string;
  source: VisibilitySource;
  prompt: string;
  gapType: GapType;
  brandVisibilityScore: number;
  competitorMentions: Array<{
    competitor: string;
    mentions: number;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  citedSources: Array<{
    title: string;
    url: string;
    citedFor: string;
  }>;
  estimatedImpact: "low" | "medium" | "high";
  reasoning: string;
}

export interface EvidenceItem {
  id: string;
  sourceUrl: string;
  title: string;
  quote: string;
  supportsClaim: string;
  riskLevel: RiskLevel;
}

export interface CreativeBrief {
  id: string;
  opportunityId: string;
  audience: string;
  hook: string;
  coreClaim: string;
  proofPoints: string[];
  constraints: string[];
  cta: string;
  editorialAngle: string;
  evidenceIds: string[];
}

export interface VideoVariant {
  id: string;
  briefId: string;
  format: "vertical_9_16" | "square_1_1" | "wide_16_9";
  title: string;
  script: string;
  scenePlan: Array<{
    timestamp: string;
    visual: string;
    narrationOrText: string;
  }>;
  heraPrompt: string;
  caption: string;
  sourceEvidenceIds: string[];
}

export interface HeraJob {
  id: string;
  videoVariantId: string;
  status: "not_started" | "queued" | "running" | "completed" | "failed";
  outputUrl?: string;
  providerPayload: Record<string, unknown>;
}

export interface OpportunityScore {
  total: number;
  intentScore: number;
  competitorGapScore: number;
  evidenceScore: number;
  videoPotentialScore: number;
  brandFitScore: number;
  reason: string;
}

export interface CampaignPack {
  project: BrandProject;
  opportunity: VisibilityOpportunity;
  score: OpportunityScore;
  evidence: EvidenceItem[];
  brief: CreativeBrief;
  variants: VideoVariant[];
  selectedVariant: VideoVariant;
  heraJob: HeraJob;
  exportMarkdown: string;
  sharePack: {
    screenRecordScript: string;
    linkedInPost: string;
    caption: string;
    tags: string[];
  };
}
