# AI Visibility to Video Agent PRD

## Document Purpose

This is the persistent product reference for the secondary Big Berlin Hack project. It should only be built after Context Surgeon has a working demo loop.

## Product Summary

AI Visibility to Video Agent turns AI-search visibility gaps into finished video campaign briefs and Hera-ready motion prompts.

It uses Peec-style visibility data to find prompts where an early-stage brand is missing, misrepresented, or losing to larger competitors. It then crawls relevant sources, writes a proof-backed creative brief, generates short-form video scripts, and optionally sends prompts to Hera for motion video generation.

## Relationship To Main Project

Context Surgeon fixes private operational context so agents act correctly.

AI Visibility to Video Agent fixes public market context so AI systems describe the brand correctly.

Shared thesis:

> Better context is now a distribution advantage. Internal agents need trustworthy private context; public AI search needs trustworthy public context.

This side project should reuse as much thinking, UI, and repo structure from Context Surgeon as possible.

## Hackathon Positioning

Primary track fit:

- Peec AI: 0 -> 1 AI Marketer
- Hera: AI Agents for Video Generation

Secondary fit:

- Viral Video Content Challenge
- Wildcard

Partner technologies:

- Peec visibility data: visibility data and prompt/opportunity discovery
- Hera API: motion video generation
- Gemini / Google DeepMind: opportunity reasoning, creative strategy, script writing
- Tavily: crawl/extract brand and competitor sources

Optional:

- Pioneer/Fastino: classify visibility gaps into campaign types
- Aikido: repo scan side challenge
- Entire: provenance/workflow story

## One-Line Pitch

Peec tells you where AI search ignores your brand. AI Visibility to Video Agent turns that gap into a proof-backed video campaign.

## Problem

Early-stage brands are now discovered inside AI answers, not only through Google search, ads, or social feeds. Tools like Peec can reveal that a brand is missing, cited poorly, or losing against bigger competitors in AI-generated recommendations.

But most small teams still do not know what to create next.

They need to answer:

- Which prompt gap matters most?
- Why is the competitor winning?
- What source or message is missing?
- What video should we create?
- What page or claim should the video point to?
- How do we avoid unsupported competitor attacks?

## Target User

Primary user:

- Founder or solo marketer at an early-stage startup competing against larger incumbents.

Secondary user:

- Growth lead using Peec to improve AI-search visibility.
- Content marketer creating short-form launch assets.
- Agency serving startups with GEO / AI-search optimization.

## Core Use Case

A startup selects a tracked brand in Peec. The system identifies one high-intent prompt where a larger competitor dominates. The agent explains the gap, crawls the brand site and competitor-cited sources, writes a video brief, and creates Hera-ready video prompts plus social copy.

Example:

- Brand: Attio
- Competitors: Salesforce, HubSpot
- Prompt gap: "best CRM for agencies with custom onboarding workflows"
- Finding: competitors are cited for enterprise trust; Attio is missing from answers because integration/use-case proof is underrepresented.
- Output: 20-second vertical video brief and Hera prompt focused on flexible workflows, proof points, and CTA to a comparison page.

## Product Principles

1. Insights should turn into creative output.
2. Every claim should be source-backed.
3. The agent should have editorial taste, not just generate generic ads.
4. The video should answer the exact prompt gap.
5. The workflow should be repeatable weekly.
6. Do not claim instant ranking lift during the hackathon.

## MVP Scope

Must have:

- Brand/project selector.
- Visibility opportunity input or Peec visibility data adapter.
- Opportunity scoring.
- Tavily source crawl/extract for brand and competitor pages.
- Creative brief generation.
- 3 video angles.
- Hera-ready motion prompts.
- Social captions.
- Export as JSON/markdown.
- Short demo path with real Peec visibility context and completed Hera output.

Should have:

- Hera live API job creation.
- Generated MP4 preview or embedded fallback.
- Compliance/risk warnings for unsupported claims.
- Public-content recommendation: page/update/video bundle.

Could have:

- Publish checklist.
- Peec rerun schedule.
- Viral video content challenge export.
- Pioneer classifier for gap type.

Will not build:

- Full social publishing automation.
- Real Peec dashboard replacement.
- Automated ranking improvement claims.
- Multi-brand campaign management.
- Full CMS integration.

## Success Criteria

Submission success:

- Demo can show Peec insight -> agent decision -> Hera video prompt/output.
- Project uses Peec + Hera + Gemini/Tavily in a coherent flow.
- README explains how this helps early-stage brands beat incumbents in AI search.

Product success:

- A judge can see the system makes a strategic editorial decision.
- The video concept is specific to the AI-search gap.
- Claims are not fake or unsupported.
- Output feels publishable or close to publishable.

## North Star Metric

Number of high-intent AI-search gaps converted into source-backed creative assets per week.

Hackathon proxy:

- One Peec visibility gap becomes one video campaign pack in under 60 seconds.

## User Experience Requirements

UI should feel like a compact marketing operations console.

Primary views:

- Visibility Opportunities
- Opportunity Detail
- Source Evidence
- Creative Brief
- Video Variants
- Hera Prompt/Preview
- Export

The user should see a single pipeline:

```text
Peec gap -> source evidence -> agent strategy -> video concepts -> Hera output -> captions
```

## Demo Flow

1. Select brand and competitor set.
2. Load Peec visibility opportunities.
3. Pick highest-value gap.
4. Agent explains why this gap matters.
5. Tavily pulls supporting brand/competitor pages.
6. Gemini writes creative brief and campaign angle.
7. System produces 3 video variants.
8. Select one variant.
9. Send to Hera and show completed Hera output.
10. Export video prompt, script, caption, CTA, and source list.

## Viral Video Angle

Potential public hook:

> ChatGPT recommends your competitor. I built an agent that turns that into a video campaign.

Short-form structure:

- 0-2 seconds: show painful AI-search gap.
- 2-8 seconds: show agent choosing the opportunity.
- 8-18 seconds: show generated creative brief/video.
- 18-25 seconds: show export pack.
- 25-30 seconds: mention Peec + Hera and hackathon.

## Risks

Risk: Peec API access is unavailable on the current plan.
Mitigation: accept real Peec visibility report/context text from the user and normalize it inside SignalCut.

Risk: Hera generation is slow or unavailable.
Mitigation: keep the requested render short and show status polling plus the Hera project link while the MP4 is being produced.

Risk: output feels generic.
Mitigation: force every video angle to answer a specific prompt and cite sources.

Risk: unsupported competitor claims.
Mitigation: include compliance warnings and source-backed claim filters.

Risk: side project steals time from main project.
Mitigation: do not begin until Context Surgeon core demo works; time-box to 6-8 hours.

## Build Time Budget

Maximum time budget: 8 hours.

Recommended split:

- 1 hour: Peec visibility context schema.
- 1 hour: source crawler/extractor adapter.
- 2 hours: creative brief and video-angle generator.
- 1 hour: Hera prompt/export adapter.
- 2 hours: UI.
- 1 hour: README/demo polish.

Stop immediately if Context Surgeon needs attention.
