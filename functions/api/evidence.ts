import { assertOk, handleError, json, readJson, requireEnv, type PagesEnv } from "./_shared";

interface EvidenceRequest {
  project: {
    brandName: string;
    websiteUrl: string;
    competitors: string[];
  };
  opportunity: {
    id: string;
    prompt: string;
    citedSources?: Array<{ title: string; url: string; citedFor: string }>;
  };
}

export const onRequestPost: PagesFunction<PagesEnv> = async ({ request, env }) => {
  try {
    const body = await readJson<EvidenceRequest>(request);
    const apiKey = requireEnv(env.TAVILY_API_KEY, "TAVILY_API_KEY");
    const query = [
      body.project.brandName,
      body.opportunity.prompt,
      body.project.competitors.join(" "),
      "proof sources claims",
    ]
      .filter(Boolean)
      .join(" ");

    const domains = [
      domainFromUrl(body.project.websiteUrl),
      ...((body.opportunity.citedSources ?? []).map((source) => domainFromUrl(source.url))),
    ].filter(Boolean);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "advanced",
        chunks_per_source: 3,
        max_results: 8,
        include_raw_content: "markdown",
        include_answer: false,
        include_domains: domains,
      }),
    });

    await assertOk(response, "Tavily");
    const data = (await response.json()) as { results?: unknown[]; request_id?: string };
    const results = Array.isArray(data.results) ? data.results : [];

    return json({
      evidence: results.slice(0, 5).map((result: any, index: number) => ({
        id: `tavily-${body.opportunity.id}-${index + 1}`,
        sourceUrl: String(result.url ?? ""),
        title: String(result.title ?? result.url ?? "Untitled source"),
        quote: String(result.raw_content ?? result.content ?? "").slice(0, 360),
        supportsClaim: String(result.content ?? result.raw_content ?? "").slice(0, 220),
        riskLevel: result.score >= 0.72 ? "low" : result.score >= 0.45 ? "medium" : "high",
      })),
      requestId: data.request_id,
    });
  } catch (error) {
    return handleError(error);
  }
};

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
