import { fetchWithRetry, handleError, json, readJson, requireEnv, type PagesEnv } from "./_shared";

export const onRequestPost: PagesFunction<PagesEnv> = async ({ request, env }) => {
  try {
    const body = await readJson<any>(request);
    const apiKey = requireEnv(env.GEMINI_API_KEY, "GEMINI_API_KEY");
    const model = env.GEMINI_MODEL ?? "gemini-flash-latest";
    const compactBody = {
      ...body,
      evidence: Array.isArray(body.evidence)
        ? body.evidence.slice(0, 4).map((item: any) => ({
            id: item.id,
            title: item.title,
            sourceUrl: item.sourceUrl,
            supportsClaim: String(item.supportsClaim ?? "").slice(0, 220),
            quote: String(item.quote ?? "").slice(0, 240),
            riskLevel: item.riskLevel,
          }))
        : [],
    };
    const prompt = `You are building a source-backed video campaign from AI-search visibility data.
Return only valid JSON with this exact shape:
{
  "brief": {
    "audience": string,
    "hook": string,
    "coreClaim": string,
    "proofPoints": string[],
    "constraints": string[],
    "cta": string,
    "editorialAngle": string,
    "evidenceIds": string[]
  },
  "variants": [
    {
      "title": string,
      "format": "vertical_9_16" | "square_1_1" | "wide_16_9",
      "script": string,
      "scenePlan": [{"timestamp": string, "visual": string, "narrationOrText": string}],
      "caption": string,
      "sourceEvidenceIds": string[]
    }
  ],
  "sharePack": {
    "screenRecordScript": string,
    "linkedInPost": string,
    "caption": string,
    "tags": string[]
  }
}
Create exactly 3 variants: direct comparison, myth-busting correction, founder-style explanation.
Use only the evidence supplied. Do not invent claims. Do not claim ranking lift.
Input:
    ${JSON.stringify(compactBody, null, 2)}`;

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      },
      "Gemini",
    );

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part: any) => part.text ?? "").join("") ?? "";
    const campaign = JSON.parse(text);

    return json(campaign);
  } catch (error) {
    return handleError(error);
  }
};
