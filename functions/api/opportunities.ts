import { fetchWithRetry, handleError, json, readJson, requireEnv, type PagesEnv } from "./_shared";

interface OpportunityRequest {
  project: {
    brandName: string;
    websiteUrl: string;
    competitors: string[];
    targetAudience: string;
    positioning: string;
  };
  peecInput: string;
}

export const onRequestPost: PagesFunction<PagesEnv> = async ({ request, env }) => {
  try {
    const body = await readJson<OpportunityRequest>(request);
    const apiKey = requireEnv(env.GEMINI_API_KEY, "GEMINI_API_KEY");
    const model = env.GEMINI_MODEL ?? "gemini-flash-latest";

    if (!body.peecInput?.trim()) {
      return json({ error: "Add real Peec visibility context before loading opportunities." }, { status: 400 });
    }

    const prompt = `Normalize this real Peec visibility data into campaign opportunities.
Return only valid JSON with this exact shape:
{
  "opportunities": [
    {
      "id": string,
      "source": "peec",
      "prompt": string,
      "gapType": "missing_brand" | "competitor_dominates" | "negative_sentiment" | "missing_source" | "wrong_positioning",
      "brandVisibilityScore": number,
      "competitorMentions": [{"competitor": string, "mentions": number, "sentiment": "positive" | "neutral" | "negative"}],
      "citedSources": [{"title": string, "url": string, "citedFor": string}],
      "estimatedImpact": "low" | "medium" | "high",
      "reasoning": string
    }
  ]
}
Rules:
- Use only the Peec input below. Do not invent prompts, sources, competitors, or scores.
- If a field is absent, infer only from nearby Peec-provided text and explain that uncertainty in reasoning.
- Prefer high-intent prompts where the brand is missing, weak, or losing to competitors.
- Return 3 to 8 opportunities if the input supports them.

Brand project:
${JSON.stringify(body.project, null, 2)}

Peec input:
${body.peecInput}`;

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
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text) as { opportunities?: unknown };

    if (!Array.isArray(parsed.opportunities)) {
      return json({ error: "Gemini did not return an opportunities array from the Peec input." }, { status: 502 });
    }

    return json({ opportunities: parsed.opportunities });
  } catch (error) {
    return handleError(error);
  }
};
