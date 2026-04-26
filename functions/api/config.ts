import { json, type PagesEnv } from "./_shared";

export const onRequestGet: PagesFunction<PagesEnv> = async ({ env }) => {
  return json({
    tavilyConfigured: Boolean(env.TAVILY_API_KEY),
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    heraConfigured: Boolean(env.HERA_API_KEY),
  });
};
