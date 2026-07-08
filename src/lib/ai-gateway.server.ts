// Server-only helpers to call Lovable AI Gateway (OpenAI-compatible)
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

function gatewayKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

async function raiseIfError(res: Response) {
  if (res.ok) return;
  const text = await res.text();
  if (res.status === 429) throw new Error("AI rate limit hit. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
  throw new Error(`AI Gateway error ${res.status}: ${text.slice(0, 200)}`);
}

export interface AiJsonOptions {
  system: string;
  user: string;
  model?: string;
}

export async function callAiJson<T = unknown>(opts: AiJsonOptions): Promise<T> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": gatewayKey() },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages: [
        { role: "system", content: opts.system + "\n\nRespond ONLY with valid JSON. No markdown, no code fences." },
        { role: "user", content: opts.user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  await raiseIfError(res);
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as T;
  } catch {
    const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

export interface AiTextOptions {
  system: string;
  user: string;
  model?: string;
}

export async function callAiText(opts: AiTextOptions): Promise<string> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": gatewayKey() },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  await raiseIfError(res);
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "").toString();
}

export async function streamAiChat(messages: Array<{ role: string; content: string }>, model?: string) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": gatewayKey() },
    body: JSON.stringify({
      model: model ?? DEFAULT_MODEL,
      messages,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    await raiseIfError(res);
    throw new Error("No stream body");
  }
  return res.body;
}
