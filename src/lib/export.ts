import type { CampaignPack } from "../types";

export function downloadTextFile(filename: string, content: string, type = "text/markdown") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function campaignJson(pack: CampaignPack) {
  return JSON.stringify(
    {
      project: pack.project,
      opportunity: pack.opportunity,
      score: pack.score,
      evidence: pack.evidence,
      brief: pack.brief,
      selectedVariant: pack.selectedVariant,
      heraJob: pack.heraJob,
      sharePack: pack.sharePack,
    },
    null,
    2,
  );
}
