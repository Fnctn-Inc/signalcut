import { assertOk, handleError, json, readJson, requireEnv, type PagesEnv } from "../_shared";

interface HeraRequest {
  prompt: string;
  format: "vertical_9_16" | "square_1_1" | "wide_16_9";
  videoVariantId: string;
}

const aspectRatios: Record<HeraRequest["format"], string> = {
  vertical_9_16: "9:16",
  square_1_1: "1:1",
  wide_16_9: "16:9",
};

export const onRequestPost: PagesFunction<PagesEnv> = async ({ request, env }) => {
  try {
    const body = await readJson<HeraRequest>(request);
    const apiKey = requireEnv(env.HERA_API_KEY, "HERA_API_KEY");
    const response = await fetch("https://api.hera.video/v1/videos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: body.prompt,
        outputs: [
          {
            format: "mp4",
            aspect_ratio: aspectRatios[body.format],
            fps: "30",
            resolution: "360p",
          },
        ],
        duration_seconds: 8,
        ...(env.HERA_STYLE_ID ? { style_id: env.HERA_STYLE_ID } : {}),
      }),
    });

    await assertOk(response, "Hera");
    const data = (await response.json()) as { video_id: string; project_url?: string };

    return json({
      id: data.video_id,
      videoVariantId: body.videoVariantId,
      status: "queued",
      outputUrl: data.project_url,
      providerPayload: data,
    });
  } catch (error) {
    return handleError(error);
  }
};
