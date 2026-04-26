import { assertOk, handleError, json, requireEnv, type PagesEnv } from "../_shared";

export const onRequestGet: PagesFunction<PagesEnv> = async ({ request, env }) => {
  try {
    const apiKey = requireEnv(env.HERA_API_KEY, "HERA_API_KEY");
    const videoId = new URL(request.url).searchParams.get("videoId");

    if (!videoId) {
      return json({ error: "Missing videoId." }, { status: 400 });
    }

    const response = await fetch(`https://api.hera.video/v1/videos/${encodeURIComponent(videoId)}`, {
      headers: {
        "x-api-key": apiKey,
      },
    });

    await assertOk(response, "Hera");
    const data = (await response.json()) as {
      video_id: string;
      status: "in-progress" | "success" | "failed";
      project_url?: string;
      outputs?: Array<{ status: string; file_url?: string | null; config?: Record<string, unknown> }>;
    };
    const outputUrl = data.outputs?.find((item) => item.file_url)?.file_url ?? undefined;

    return json({
      id: data.video_id,
      videoVariantId: "",
      status: data.status === "success" ? "completed" : data.status === "in-progress" ? "running" : "failed",
      outputUrl: outputUrl ?? data.project_url,
      providerPayload: data,
    });
  } catch (error) {
    return handleError(error);
  }
};
