import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
});

const SYSTEM = `You are TALA, an AI teaching assistant for Filipino public school teachers.
You are an expert on the Philippine DepEd MATATAG Curriculum, the K-12 (K to 12 Basic Education Program), and the Revised K-10 curriculum.
You help teachers with lesson planning (ILAW / DLL / DLP), Tables of Specification, Bloom's taxonomy, MELCs, assessments, rubrics, worksheets, classroom management and pedagogy.
You reply fluently in either English or Filipino / Taglish depending on the language the user writes in. Be warm, concise, and practical. Use markdown when helpful (headings, bullets, tables). Cite DepEd terminology accurately (e.g. LC, MELC, KRA, KPI, PPST, RPMS).
If a question is outside your teaching-support scope, politely redirect to how it may apply to teaching.`;

export const Route = createFileRoute("/api/tala-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = Body.safeParse(payload);
        if (!parsed.success) {
          return new Response("Invalid payload: " + parsed.error.message, { status: 400 });
        }

        const { streamAiChat } = await import("@/lib/ai-gateway.server");
        const messages = [
          { role: "system" as const, content: SYSTEM },
          ...parsed.data.messages,
        ];

        let upstream: ReadableStream<Uint8Array>;
        try {
          upstream = await streamAiChat(messages);
        } catch (err) {
          return new Response(err instanceof Error ? err.message : "AI error", { status: 500 });
        }

        // Parse OpenAI SSE and emit newline-delimited plain-text deltas so the
        // client can just readable.getReader().read() and append.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const out = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.getReader();
            let buffer = "";
            try {
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const raw of lines) {
                  const line = raw.trim();
                  if (!line.startsWith("data:")) continue;
                  const body = line.slice(5).trim();
                  if (body === "[DONE]") continue;
                  try {
                    const evt = JSON.parse(body);
                    const delta: string =
                      evt?.choices?.[0]?.delta?.content ??
                      evt?.choices?.[0]?.message?.content ??
                      "";
                    if (delta) controller.enqueue(encoder.encode(delta));
                  } catch {
                    /* ignore keep-alives */
                  }
                }
              }
            } catch (err) {
              controller.error(err);
              return;
            } finally {
              controller.close();
            }
          },
        });

        return new Response(out, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
