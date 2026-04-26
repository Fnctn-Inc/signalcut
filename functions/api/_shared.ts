export interface PagesEnv {
  TAVILY_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  HERA_API_KEY?: string;
  HERA_STYLE_ID?: string;
}

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new HttpError(424, `${name} is not configured.`);
  }

  return value;
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return json({ error: error.message }, { status: error.status });
  }

  return json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 });
}

export async function assertOk(response: Response, provider: string) {
  if (response.ok) {
    return;
  }

  const body = await response.text();
  throw new HttpError(response.status, `${provider} request failed: ${body.slice(0, 800)}`);
}

export async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit, provider: string) {
  let lastStatus = 500;
  let lastBody = "";
  const retryStatuses = new Set([429, 500, 502, 503, 504]);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(input, init);
    if (response.ok) {
      return response;
    }

    lastStatus = response.status;
    lastBody = await response.text();

    if (!retryStatuses.has(response.status) || attempt === 2) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
  }

  throw new HttpError(lastStatus, `${provider} request failed after retries: ${lastBody.slice(0, 800)}`);
}
