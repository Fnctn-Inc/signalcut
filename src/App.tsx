import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Clipboard,
  Download,
  ExternalLink,
  FileJson,
  Film,
  Flame,
  Gauge,
  Loader2,
  LogOut,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Wand2,
  Zap,
  TriangleAlert,
} from "lucide-react";
import {
  createHeraJob,
  generateLiveCampaign,
  getEvidence,
  getHeraJobStatus,
  getOpportunities,
  type LiveCampaignResponse,
} from "./lib/api";
import { campaignJson, downloadTextFile } from "./lib/export";
import { scoreOpportunity } from "./lib/scoring";
import type { BrandProject, CampaignPack, CreativeBrief, EvidenceItem, HeraJob, VideoVariant, VisibilityOpportunity } from "./types";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "signed-out"; user: null }
  | { status: "signed-in"; user: GuestUser };

interface GuestUser {
  uid: "guest";
  displayName: "Guest session";
  email: null;
}

const emptyProject: BrandProject = {
  id: "live-project",
  brandName: "",
  websiteUrl: "",
  competitors: [],
  targetAudience: "",
  positioning: "",
};

const pipelineSteps = ["Peec gap", "Source evidence", "Campaign strategy", "Video concepts", "Hera output", "Export"];

function App() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading", user: null });
  const [project, setProject] = useState<BrandProject>(emptyProject);
  const [competitorText, setCompetitorText] = useState("");
  const [opportunities, setOpportunities] = useState<VisibilityOpportunity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [liveCampaign, setLiveCampaign] = useState<LiveCampaignResponse | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [heraJob, setHeraJob] = useState<HeraJob | null>(null);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("autoGuest")) {
      setAuthState({
        status: "signed-in",
        user: {
          uid: "guest",
          displayName: "Guest session",
          email: null,
        },
      });
      return;
    }

    setAuthState({ status: "signed-out", user: null });
  }, []);

  const selectedOpportunity = opportunities.find((item) => item.id === selectedOpportunityId) ?? opportunities[0];

  const rankedOpportunities = useMemo(
    () =>
      opportunities
        .map((opportunity) => ({
          opportunity,
          score: scoreOpportunity(project, opportunity, opportunity.id === selectedOpportunityId ? evidence : []),
        }))
        .sort((a, b) => b.score.total - a.score.total),
    [evidence, opportunities, project, selectedOpportunityId],
  );

  const campaign = useMemo<CampaignPack | null>(() => {
    if (!selectedOpportunity || !liveCampaign || !heraJob) {
      return null;
    }

    const score = scoreOpportunity(project, selectedOpportunity, evidence);
    const brief: CreativeBrief = {
      ...liveCampaign.brief,
      id: `brief-${selectedOpportunity.id}`,
      opportunityId: selectedOpportunity.id,
    };
    const variants = liveCampaign.variants.map<VideoVariant>((variant, index) => ({
      ...variant,
      id: `${selectedOpportunity.id}-variant-${index + 1}`,
      briefId: brief.id,
      heraPrompt: buildHeraPrompt(project, selectedOpportunity, brief, variant),
    }));
    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];

    return {
      project,
      opportunity: selectedOpportunity,
      score,
      evidence,
      brief,
      variants,
      selectedVariant,
      heraJob,
      exportMarkdown: buildMarkdown(project, selectedOpportunity, score, evidence, brief, selectedVariant, heraJob),
      sharePack: liveCampaign.sharePack,
    };
  }, [evidence, heraJob, liveCampaign, project, selectedOpportunity, selectedVariantId]);

  useEffect(() => {
    if (campaign && !selectedVariantId) {
      setSelectedVariantId(campaign.variants[0].id);
    }
  }, [campaign, selectedVariantId]);

  useEffect(() => {
    if (!heraJob || !["queued", "running"].includes(heraJob.status)) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const next = await getHeraJobStatus(heraJob.id);
        if (!cancelled) {
          setHeraJob((current) =>
            current
              ? {
                  ...current,
                  status: next.status,
                  outputUrl: next.outputUrl,
                  providerPayload: next.providerPayload,
                }
              : current,
          );
        }
      } catch {
        return;
      }

      if (!cancelled && attempts < 20) {
        window.setTimeout(poll, 12000);
      }
    };

    const timeout = window.setTimeout(poll, 12000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [heraJob]);

  async function handleSignIn() {
    setError("");
    setAuthState({
      status: "signed-in",
      user: {
        uid: "guest",
        displayName: "Guest session",
        email: null,
      },
    });
  }

  async function handleSignOut() {
    setAuthState({ status: "signed-out", user: null });
  }

  function updateProject(field: keyof BrandProject, value: string) {
    setProject((current) => ({ ...current, [field]: value }));
  }

  async function loadOpportunities() {
    setError("");
    setIsLoadingOpportunities(true);
    setEvidence([]);
    setLiveCampaign(null);
    setHeraJob(null);
    setSelectedVariantId(undefined);

    try {
      const liveProject = {
        ...project,
        competitors: competitorText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      setProject(liveProject);
      const result = await getOpportunities(liveProject, liveProject.positioning);
      setOpportunities(result.opportunities);
      setSelectedOpportunityId(result.opportunities[0]?.id ?? "");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoadingOpportunities(false);
    }
  }

  async function generateCampaign() {
    if (!selectedOpportunity) {
      return;
    }

    setError("");
    setIsGenerating(true);
    setLiveCampaign(null);
    setHeraJob(null);
    setSelectedVariantId(undefined);

    try {
      const evidenceResult = await getEvidence(project, selectedOpportunity);
      const compactEvidence = evidenceResult.evidence.slice(0, 5);
      setEvidence(compactEvidence);
      const score = scoreOpportunity(project, selectedOpportunity, compactEvidence);
      const generated = await generateLiveCampaign(project, selectedOpportunity, score, compactEvidence);
      setLiveCampaign(generated);
      const firstVariant = generated.variants[0];
      const prompt = buildHeraPrompt(project, selectedOpportunity, {
        ...generated.brief,
        id: `brief-${selectedOpportunity.id}`,
        opportunityId: selectedOpportunity.id,
      }, firstVariant);
      const job = await createHeraJob(prompt, firstVariant.format, `${selectedOpportunity.id}-variant-1`);
      setHeraJob(job);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyBlock(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1200);
  }

  if (authState.status !== "signed-in") {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand-mark">
            <Sparkles size={18} />
            SignalCut
          </div>
          <h1>Turn live AI-search gaps into video campaigns.</h1>
          <p>Source-backed campaign strategy for teams competing inside AI answers.</p>
          <SponsorStrip />
          <HackathonPhoto compact />
          <div className="auth-actions">
            <button className="primary-btn" onClick={handleSignIn}>
              <User size={16} />
              Enter SignalCut
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
          {authState.status === "loading" && (
            <div className="loading-line">
              <Loader2 size={16} className="spin" />
              Loading session
            </div>
          )}
        </section>
        <BuildCredit />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-mark compact">
            <Sparkles size={17} />
            SignalCut
          </div>
          <SponsorStrip compact />
          <div className="pipeline">
            {pipelineSteps.map((step, index) => (
              <span key={step}>
                {step}
                {index < pipelineSteps.length - 1 && <ChevronRight size={13} />}
              </span>
            ))}
          </div>
        </div>
        <div className="session">
          <span>{authState.user.displayName || authState.user.email || "Signed in"}</span>
          <button className="icon-btn" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="field-stack">
            <Input label="Brand name" value={project.brandName} onChange={(value) => updateProject("brandName", value)} />
            <Input label="Website URL" value={project.websiteUrl} onChange={(value) => updateProject("websiteUrl", value)} />
            <Input label="Competitors" value={competitorText} onChange={setCompetitorText} />
            <Textarea label="Target audience" value={project.targetAudience} onChange={(value) => updateProject("targetAudience", value)} />
            <Textarea
              label="Positioning and visibility context"
              value={project.positioning}
              onChange={(value) => updateProject("positioning", value)}
              variant="context"
            />
            <button className="primary-btn full" onClick={loadOpportunities} disabled={isLoadingOpportunities || !project.brandName || !project.websiteUrl || !project.positioning.trim()}>
              {isLoadingOpportunities ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              Normalize Peec opportunities
            </button>
          </div>
          <HackathonPhoto />

          <div className="sidebar-heading">
            <Search size={16} />
            Visibility Opportunities
          </div>
          <div className="opportunity-list">
            {rankedOpportunities.map(({ opportunity, score }) => (
              <button
                className={`opportunity-item ${opportunity.id === selectedOpportunity?.id ? "active" : ""}`}
                key={opportunity.id}
                onClick={() => {
                  setSelectedOpportunityId(opportunity.id);
                  setEvidence([]);
                  setLiveCampaign(null);
                  setHeraJob(null);
                  setSelectedVariantId(undefined);
                }}
              >
                <span className="score">{score.total}</span>
                <span>
                  <strong>{opportunity.prompt}</strong>
                  <small>{formatGap(opportunity.gapType)} · {opportunity.estimatedImpact} impact</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="center-pane">
          {error && (
            <div className="notice error-notice">
              <TriangleAlert size={16} />
              {error}
            </div>
          )}

          {selectedOpportunity ? (
            <>
              <div className="panel hero-panel">
                <div className="panel-kicker">
                  <Gauge size={16} />
                  Opportunity score {scoreOpportunity(project, selectedOpportunity, evidence).total}/100
                </div>
                <h2>{selectedOpportunity.prompt}</h2>
                <p>{selectedOpportunity.reasoning}</p>
                <button className="primary-btn" onClick={generateCampaign} disabled={isGenerating}>
                  {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                  Generate campaign
                </button>
              </div>

              <EvidencePanel evidence={evidence} />
              {campaign && <BriefPanel brief={campaign.brief} />}
            </>
          ) : (
            <div className="panel empty-panel">
              <Search size={24} />
              <h2>Enter a brand project and visibility context.</h2>
              <p>SignalCut turns that context into ranked creative opportunities before campaign generation.</p>
            </div>
          )}
        </section>

        <aside className="output-pane">
          {campaign ? (
            <>
              <VideoPanel campaign={campaign} onSelectVariant={setSelectedVariantId} />
              <div className="panel">
                <div className="panel-title">
                  <Sparkles size={17} />
                  Hera Prompt
                </div>
                <pre className="prompt-block">{campaign.selectedVariant.heraPrompt}</pre>
                <button className="secondary-btn full" onClick={() => copyBlock("hera", campaign.selectedVariant.heraPrompt)}>
                  {copied === "hera" ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied === "hera" ? "Copied" : "Copy Hera prompt"}
                </button>
                <HeraOutput job={campaign.heraJob} title={campaign.selectedVariant.title} />
              </div>
              <ExportPanel campaign={campaign} />
            </>
          ) : (
            <div className="panel empty-panel">
              <Film size={24} />
              <h2>Campaign output appears after live generation.</h2>
              <p>SignalCut builds the campaign pack after source evidence and strategy are ready.</p>
            </div>
          )}
        </aside>
      </section>
      <BuildCredit />
    </main>
  );
}

function HeraOutput({ job, title }: { job: HeraJob; title: string }) {
  const isMp4 = Boolean(job.outputUrl && String(job.outputUrl).includes(".mp4"));
  const isDone = job.status === "completed";
  const statusLabel = isDone ? "Ready to play" : job.status === "failed" ? "Needs attention" : "Rendering";

  return (
    <div className={`hera-output ${isDone ? "ready" : ""}`}>
      <div className="hera-output-header">
        <div>
          <span>Generated video</span>
          <strong>{title}</strong>
        </div>
        <span className={`status-pill ${job.status}`}>{statusLabel}</span>
      </div>

      {isMp4 && job.outputUrl ? (
        <>
          <div className="hera-player-shell">
            <video className="hera-video" controls preload="metadata" src={job.outputUrl} />
          </div>
          <a className="play-link" href={job.outputUrl} target="_blank" rel="noreferrer">
            <Play size={16} />
            Open playable MP4
          </a>
        </>
      ) : (
        <div className="hera-rendering">
          <Loader2 size={18} className={job.status === "failed" ? "" : "spin"} />
          <div>
            <strong>{job.status === "failed" ? "Hera render failed" : "Hera is rendering the video"}</strong>
            <p>{job.status === "failed" ? "Try generating again with a shorter prompt." : "The player appears here automatically when the MP4 is ready."}</p>
          </div>
        </div>
      )}

      {job.outputUrl && !isMp4 && (
        <a className="play-link secondary" href={job.outputUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open Hera project
        </a>
      )}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="input-label">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  variant,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  variant?: "context";
}) {
  return (
    <label className={`input-label ${variant === "context" ? "context-field" : ""}`}>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SponsorStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`sponsor-strip ${compact ? "compact" : ""}`} aria-label="Sponsors">
      <span>
        <Search size={13} />
        Peec AI
      </span>
      <span>
        <Wand2 size={13} />
        Hera
      </span>
      <span>
        <Sparkles size={13} />
        Google DeepMind
      </span>
      <span>
        <ShieldCheck size={13} />
        Tavily
      </span>
    </div>
  );
}

function HackathonPhoto({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`berlin-photo ${compact ? "compact" : ""}`} aria-label="Built for Big Berlin Hack">
      <div>
        <span>Built for Berlin</span>
        <strong>Big Berlin Hack</strong>
      </div>
      <Zap size={compact ? 18 : 24} />
    </div>
  );
}

function BuildCredit() {
  return (
    <div className="build-credit">
      Built with love by humans and agents at <a href="https://fnctn.io" target="_blank" rel="noreferrer">FNCTN.io</a>
    </div>
  );
}

function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <ShieldCheck size={17} />
        Source Evidence
      </div>
      {evidence.length === 0 ? (
        <p className="muted">Generate a campaign to retrieve source-backed evidence.</p>
      ) : (
        <div className="evidence-list">
          {evidence.map((item) => (
            <article className="evidence-item" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} />
                  Source
                </a>
              </div>
              <p>{item.supportsClaim}</p>
              <span className={`risk ${item.riskLevel}`}>{item.riskLevel} risk</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function BriefPanel({ brief }: { brief: CreativeBrief }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <Flame size={17} />
        Creative Brief
      </div>
      <div className="brief-grid">
        <BriefBlock label="Hook" value={brief.hook} />
        <BriefBlock label="Core claim" value={brief.coreClaim} />
        <BriefBlock label="Editorial angle" value={brief.editorialAngle} />
        <BriefBlock label="CTA" value={brief.cta} />
      </div>
    </div>
  );
}

function VideoPanel({ campaign, onSelectVariant }: { campaign: CampaignPack; onSelectVariant: (id: string) => void }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <Film size={17} />
        Video Variants
      </div>
      <div className="variant-tabs">
        {campaign.variants.map((variant) => (
          <button
            key={variant.id}
            className={variant.id === campaign.selectedVariant.id ? "active" : ""}
            onClick={() => onSelectVariant(variant.id)}
          >
            {variant.title}
          </button>
        ))}
      </div>
      <div className="video-preview">
        <div className="preview-frame">
          <Play size={28} />
          <span>{campaign.selectedVariant.format.replaceAll("_", ":")}</span>
        </div>
        <div>
          <strong>{campaign.selectedVariant.title}</strong>
          <p>{campaign.selectedVariant.caption}</p>
        </div>
      </div>
      <div className="script-block">
        <label>Script</label>
        <pre>{campaign.selectedVariant.script}</pre>
      </div>
    </div>
  );
}

function ExportPanel({ campaign }: { campaign: CampaignPack }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <Download size={17} />
        Export Campaign Pack
      </div>
      <div className="export-actions">
        <button className="secondary-btn" onClick={() => downloadTextFile(`${campaign.project.id}-campaign-pack.md`, campaign.exportMarkdown)}>
          <Download size={16} />
          Markdown
        </button>
        <button className="secondary-btn" onClick={() => downloadTextFile(`${campaign.project.id}-campaign-pack.json`, campaignJson(campaign), "application/json")}>
          <FileJson size={16} />
          JSON
        </button>
      </div>
      <div className="share-pack">
        <strong>Hackathon share pack</strong>
        <p>{campaign.sharePack.caption}</p>
        <small>{campaign.sharePack.tags.join(" ")}</small>
      </div>
    </div>
  );
}

function BriefBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="brief-block">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function buildHeraPrompt(project: BrandProject, opportunity: VisibilityOpportunity, brief: CreativeBrief, variant: Omit<VideoVariant, "id" | "briefId" | "heraPrompt">) {
  const sceneTimes = ["0-2s", "2-5s", "5-8s"];

  return `Create an 8-second ${variant.format} motion graphics video for ${project.brandName}.
Goal: answer the AI-search prompt "${opportunity.prompt}".
Style: clean product motion graphics, high contrast, fast readable captions.
Scenes:
${variant.scenePlan.slice(0, 3).map((scene, index) => `${sceneTimes[index]}: ${scene.visual} Text/VO: ${scene.narrationOrText}`).join("\n")}
Use these proof points only:
${brief.proofPoints.slice(0, 2).map((point) => `- ${point}`).join("\n")}
CTA: ${brief.cta}
Avoid unsupported claims about competitors.`;
}

function buildMarkdown(
  project: BrandProject,
  opportunity: VisibilityOpportunity,
  score: ReturnType<typeof scoreOpportunity>,
  evidence: EvidenceItem[],
  brief: CreativeBrief,
  variant: VideoVariant,
  heraJob: HeraJob,
) {
  return `# ${project.brandName} AI Visibility Video Campaign

## Selected Gap
- Prompt: ${opportunity.prompt}
- Gap type: ${opportunity.gapType}
- Score: ${score.total}/100
- Why it matters: ${score.reason}

## Creative Brief
- Audience: ${brief.audience}
- Hook: ${brief.hook}
- Core claim: ${brief.coreClaim}
- Editorial angle: ${brief.editorialAngle}
- CTA: ${brief.cta}

## Proof Points
${brief.proofPoints.map((point) => `- ${point}`).join("\n")}

## Selected Video Variant
- Title: ${variant.title}
- Format: ${variant.format}

### Script
${variant.script}

### Hera Prompt
${variant.heraPrompt}

## Caption
${variant.caption}

## Evidence
${evidence.map((item) => `- [${item.id}] ${item.title}: ${item.supportsClaim} (${item.sourceUrl})`).join("\n")}

## Risk Notes
${brief.constraints.map((constraint) => `- ${constraint}`).join("\n")}

## Hera Job
- ID: ${heraJob.id}
- Status: ${heraJob.status}
- URL: ${heraJob.outputUrl ?? ""}
`;
}

function formatGap(gap: VisibilityOpportunity["gapType"]) {
  return gap.replaceAll("_", " ");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export default App;
