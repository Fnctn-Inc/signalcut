# SignalCut

SignalCut turns AI-search visibility gaps into source-backed video campaigns.

## Deployment

Live production app: [https://signalcut.pages.dev](https://signalcut.pages.dev)

Built at Big Berlin Hack for teams that need to turn distribution insight into something they can ship immediately.

## What It Does

Early-stage brands increasingly compete inside AI answers, not only on search result pages. A brand can be the best fit for a specific buyer and still lose because answer engines keep recommending larger incumbents.

SignalCut takes visibility context from Peec AI, finds the highest-value prompt gap, pulls source evidence, writes a grounded creative strategy, and generates a Hera video asset.

Example demo scenario:

- Brand: Attio
- Competitors: Salesforce and HubSpot
- Prompt gap: "best CRM for agencies with custom onboarding workflows"
- Output: ranked opportunity, source evidence, campaign brief, video variants, Hera prompt, completed MP4, and exportable campaign pack

## Hackathon Partner Technologies

SignalCut uses at least three Big Berlin Hack partner technologies:

- **Peec AI**: visibility context and prompt-gap input. SignalCut normalizes Peec visibility reports into campaign opportunities.
- **Hera**: AI video generation. SignalCut sends an opinionated creative prompt to Hera and displays the completed MP4 in the app.
- **Google DeepMind / Gemini**: campaign reasoning, opportunity normalization, creative strategy, scripts, and Hera prompt generation.
- **Tavily**: live source evidence retrieval for proof-backed campaign claims.

## Product Flow

1. Enter a brand, website, competitors, target audience, and visibility context.
2. Normalize the visibility context into ranked AI-search opportunities.
3. Select the strongest prompt gap.
4. Pull source evidence with Tavily.
5. Generate the campaign brief and video variants with Gemini.
6. Create a Hera video job from the selected variant.
7. Review the completed video and export the campaign pack as Markdown or JSON.

## Architecture

SignalCut is a Vite React app deployed to Cloudflare Pages with Pages Functions for provider integrations.

```text
React UI
  -> /api/opportunities  -> Gemini
  -> /api/evidence       -> Tavily
  -> /api/campaign       -> Gemini
  -> /api/hera/jobs      -> Hera
  -> /api/hera/status    -> Hera
```

Provider keys are never exposed to the browser. They are stored as Cloudflare Pages secrets and used only inside server-side functions.

## Tech Stack

- React 19
- TypeScript
- Vite
- Cloudflare Pages and Pages Functions
- Gemini API
- Tavily API
- Hera API
- Lucide icons

## Repository Structure

```text
src/
  App.tsx              Main product UI and flow orchestration
  lib/api.ts           Browser-safe API client
  lib/scoring.ts       Opportunity scoring
  lib/export.ts        Markdown/JSON campaign export helpers
functions/api/
  opportunities.ts     Peec visibility context -> ranked opportunities
  evidence.ts          Tavily source retrieval
  campaign.ts          Gemini campaign strategy generation
  hera/jobs.ts         Hera video job creation
  hera/status.ts       Hera polling/status endpoint
docs/hackathon/
  signalcut-demo-plan.md
  ai-visibility-video-agent-prd.md
  ai-visibility-video-agent-feature-spec.md
```

## Local Setup

Prerequisites:

- Node.js 20+
- npm
- API keys for Tavily, Gemini, and Hera

Install dependencies:

```bash
npm install
```

Create local secrets:

```bash
cp .env.example .dev.vars
```

Fill `.dev.vars`:

```bash
TAVILY_API_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-flash-latest
HERA_API_KEY=...
HERA_STYLE_ID=
```

Run locally:

```bash
npm run dev
```

For local Pages Functions parity, use Wrangler:

```bash
npx wrangler pages dev dist
```

Most development work can be done with Vite. Use Wrangler when validating Cloudflare Pages Functions behavior.

## Build

```bash
npm run build
```

This runs TypeScript checks for both the Vite app and Cloudflare Functions, then builds the static frontend into `dist/`.

## Cloudflare Deployment

The project is configured for Cloudflare Pages in `wrangler.toml`.

```toml
name = "signalcut"
pages_build_output_dir = "dist"
compatibility_date = "2026-04-25"
```

Set production secrets:

```bash
npx wrangler pages secret bulk .dev.vars --project-name signalcut
```

Deploy:

```bash
npm run build
npx wrangler pages deploy dist --project-name signalcut --branch main --commit-dirty=true
```

Production URL:

[https://signalcut.pages.dev](https://signalcut.pages.dev)

## Security Notes

- Do not commit `.dev.vars`, `.env.local`, `.wrangler/`, `dist/`, `node_modules/`, or `artifacts/`.
- Provider keys are server-side only.
- The browser receives only generated campaign data and provider job status.
- The app avoids unsupported competitor claims by grounding generated strategy in retrieved evidence.

## Scripts

```bash
npm run dev        # Start Vite development server
npm run build      # Typecheck and build
npm run preview    # Preview built app locally
npm run typecheck  # Typecheck app and functions
```

## Submission Checklist

- Live product deployed: [https://signalcut.pages.dev](https://signalcut.pages.dev)
- Public repository with setup instructions
- README documents partner technologies
- README documents APIs and deployment
- Source code avoids committed secrets
