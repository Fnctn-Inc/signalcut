import type {
  BrandProject,
  CreativeBrief,
  EvidenceItem,
  HeraJob,
  OpportunityScore,
  VideoVariant,
  VisibilityOpportunity,
} from "../types";

export interface RuntimeConfig {
  tavilyConfigured: boolean;
  geminiConfigured: boolean;
  heraConfigured: boolean;
}

export interface LiveCampaignResponse {
  brief: Omit<CreativeBrief, "id" | "opportunityId">;
  variants: Array<Omit<VideoVariant, "id" | "briefId" | "heraPrompt">>;
  sharePack: {
    screenRecordScript: string;
    linkedInPost: string;
    caption: string;
    tags: string[];
  };
}

export async function getRuntimeConfig() {
  return apiFetch<RuntimeConfig>("/api/config");
}

export async function getOpportunities(project: BrandProject, peecInput: string) {
  return apiFetch<{ opportunities: VisibilityOpportunity[] }>("/api/opportunities", {
    method: "POST",
    body: JSON.stringify({ project, peecInput }),
  });
}

export async function getEvidence(project: BrandProject, opportunity: VisibilityOpportunity) {
  return apiFetch<{ evidence: EvidenceItem[]; requestId?: string }>("/api/evidence", {
    method: "POST",
    body: JSON.stringify({ project, opportunity }),
  });
}

export async function generateLiveCampaign(
  project: BrandProject,
  opportunity: VisibilityOpportunity,
  score: OpportunityScore,
  evidence: EvidenceItem[],
) {
  return apiFetch<LiveCampaignResponse>("/api/campaign", {
    method: "POST",
    body: JSON.stringify({ project, opportunity, score, evidence }),
  });
}

export async function createHeraJob(prompt: string, format: VideoVariant["format"], videoVariantId: string) {
  return apiFetch<HeraJob>("/api/hera/jobs", {
    method: "POST",
    body: JSON.stringify({ prompt, format, videoVariantId }),
  });
}

export async function getHeraJobStatus(videoId: string) {
  return apiFetch<HeraJob>(`/api/hera/status?videoId=${encodeURIComponent(videoId)}`);
}

async function apiFetch<T>(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });

  const data = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with ${response.status}`);
  }

  return data as T;
}
