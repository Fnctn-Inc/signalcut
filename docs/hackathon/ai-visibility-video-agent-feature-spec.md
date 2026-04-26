# AI Visibility to Video Agent Feature Spec

## Document Purpose

This file defines the implementable scope for the secondary Peec + Hera project. Build this only after the main Context Surgeon demo is viable.

## Architecture

Recommended structure if built in same repo:

```text
apps/
  context-surgeon/
  ai-visibility-video-agent/
packages/
  provider-adapters/
  ui/
  demo-data/
docs/
  hackathon/
```

Lightweight alternative:

```text
side_projects/ai-visibility-video-agent/
  app/
  demo_data/
  README.md
```

Use the fastest stack already available from Context Surgeon.

## Data Models

```typescript
export type VisibilitySource = "peec";
export type GapType =
  | "missing_brand"
  | "competitor_dominates"
  | "negative_sentiment"
  | "missing_source"
  | "wrong_positioning";

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
  riskLevel: "low" | "medium" | "high";
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
```

## Feature 1: Seeded Peec Opportunity Data

Goal:

Accept real Peec visibility context even when direct API access is unavailable.

Acceptance criteria:

- App normalizes 3-5 opportunities from user-provided Peec visibility context when enough signal is available.
- Each opportunity has prompt, gap type, competitor mentions, cited sources, and reasoning.
- UI keeps the Peec context visible so judges can inspect the source signal.

Example opportunities:

- Attio missing from "best CRM for agencies with custom onboarding workflows"
- Nothing Phone losing to Apple/Samsung for "best AI-native smartphone"
- BYD underrepresented for "best EV for European families"

## Feature 2: Opportunity Ranking

Goal:

Pick the best creative opportunity.

Scoring inputs:

- Gap type severity.
- Prompt intent.
- Competitor dominance.
- Availability of proof points.
- Brand fit.
- Video suitability.

Acceptance criteria:

- Each opportunity shows score and reason.
- Top opportunity can be selected automatically.
- User can override selection.

Simple scoring:

```typescript
score =
  intentScore * 0.3 +
  competitorGapScore * 0.25 +
  evidenceScore * 0.2 +
  videoPotentialScore * 0.15 +
  brandFitScore * 0.1
```

## Feature 3: Tavily Source Evidence

Goal:

Gather source-backed proof points.

Inputs:

- Brand URL.
- Competitor URLs or cited sources.
- Selected prompt.

Acceptance criteria:

- Live Tavily adapter can query/extract if key exists.
- Live mode returns source evidence from Tavily.
- Evidence is attached to claims.
- Unsupported claims are flagged.

Provider mode:

```text
TAVILY_API_KEY=
PEEC_VISIBILITY_INPUT=manual
HERA_API_KEY=
```

## Feature 4: Creative Brief Generator

Goal:

Use Gemini to turn visibility gap + evidence into a useful creative strategy.

Output must include:

- Target audience.
- Hook.
- Core claim.
- Proof points.
- Constraints and claim risks.
- CTA.
- Editorial angle.

Acceptance criteria:

- Brief references evidence IDs.
- Brief does not invent unsupported competitor claims.
- Brief explains why this video answers the selected AI-search prompt.

## Feature 5: Video Variant Generator

Goal:

Produce 3 distinct video concepts.

Required variants:

- Direct comparison.
- Myth-busting / correction.
- Founder-style explanation.

Acceptance criteria:

- Each variant has script, scene plan, Hera prompt, caption, CTA.
- Each variant is mapped to one target format.
- User can select a variant for Hera.

## Feature 6: Hera Prompt/Job Adapter

Goal:

Generate Hera-ready motion graphics prompts and optionally call Hera.

Acceptance criteria:

- `POST /api/hera/jobs` or equivalent function creates a job if API key exists.
- Status polling displays the completed Hera MP4 when it is ready.
- Hera prompt includes format, duration, visual style, text overlays, pacing, and CTA.
- App can export prompt even without live video.

Prompt template:

```text
Create a {duration}-second {format} motion graphics video for {brand}.
Goal: answer the AI-search prompt "{prompt}".
Style: clean SaaS product launch motion graphics, high contrast, fast readable captions.
Scenes:
{scene_plan}
Use these proof points only:
{proof_points}
CTA: {cta}
Avoid unsupported claims about competitors.
```

## Feature 7: Campaign Export

Goal:

Produce a reusable campaign pack.

Export formats:

- Markdown.
- JSON.
- Copy-to-clipboard blocks.

Contents:

- Selected opportunity.
- Brief.
- Video variants.
- Hera prompt.
- Caption.
- CTA.
- Suggested landing page/source update.
- Evidence list.
- Risk notes.

Acceptance criteria:

- Export file is saved locally or downloadable.
- README includes sample export.

## Feature 8: UI

Views:

- Opportunities
- Evidence
- Brief
- Video Variants
- Hera Preview
- Export

Demo-friendly layout:

- Left: opportunities list.
- Center: selected gap and agent reasoning.
- Right: generated campaign/video output.

Important badges:

- Missing brand
- Competitor dominates
- Source-backed
- Claim risk
- Hera-ready

## Feature 9: Viral Video Export

Goal:

Generate a short script for the hackathon viral video content challenge.

Output:

- 30-second screen-record script.
- X/LinkedIn post copy.
- Caption.
- Suggested tags.

Acceptance criteria:

- App can export a "share pack" for the demo.
- Content explicitly says built with Peec + Hera.

## Build Order

1. Peec visibility context intake.
2. Opportunity scoring.
3. Tavily evidence adapter.
4. Creative brief generator.
5. Video variant generator.
6. Hera prompt/export.
7. Minimal UI.
8. README and demo script.

## Demo Script

1. Select brand: Attio.
2. Load Peec opportunities.
3. Show prompt where Salesforce/HubSpot dominate.
4. Click "Generate Campaign".
5. Show Tavily evidence and source-backed proof points.
6. Show creative brief.
7. Show 3 video variants.
8. Select "Direct comparison".
9. Show Hera prompt and live video preview.
10. Export campaign pack.

## Stop Conditions

Do not build further if:

- Context Surgeon patch demo is not complete.
- Context Surgeon README is incomplete.
- Submission video for main project is not recorded.
- This side project exceeds 8 hours.
