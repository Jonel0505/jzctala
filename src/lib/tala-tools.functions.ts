import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RubricInput = z.object({
  activity: z.string().min(2).max(400),
  subject: z.string().max(120).optional().default(""),
  grade: z.string().max(80).optional().default(""),
  rubric_type: z.enum(["analytic", "holistic", "single_point", "checklist"]),
  levels: z.number().int().min(3).max(6).default(4),
});

export interface RubricRow {
  criterion: string;
  weight: number;
  descriptors: string[]; // length == levels, ordered highest -> lowest
}
export interface RubricContent {
  title: string;
  rubric_type: string;
  level_labels: string[]; // highest -> lowest
  rows: RubricRow[];
  notes?: string;
}

export const generateRubric = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RubricInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAiJson } = await import("./ai-gateway.server");
    const out = await callAiJson<RubricContent>({
      system:
        "You are TALA. Build fair, DepEd-aligned rubrics for Filipino teachers. Choose criteria appropriate to the activity type. Weights should sum to 100.",
      user: `Rubric Type: ${data.rubric_type}
Activity: ${data.activity}
Subject: ${data.subject || "n/a"}
Grade: ${data.grade || "n/a"}
Performance Levels: ${data.levels}

Return JSON: { title, rubric_type, level_labels (array length=${data.levels}, from highest to lowest e.g. "Excellent","Proficient","Developing","Beginning"), rows: [{ criterion, weight (0-100), descriptors (array length=${data.levels}, ordered highest to lowest) }], notes }`,
    });
    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Generated Rubric",
      details: out.title,
    });
    return out;
  });

const RewriteInput = z.object({
  text: z.string().min(3).max(6000),
  style: z.enum(["simplify", "formal", "friendly", "shorten", "expand", "grammar"]),
  audience: z.string().max(120).optional().default("students"),
});

export const rewriteText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RewriteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAiText } = await import("./ai-gateway.server");
    const styles: Record<string, string> = {
      simplify: "Rewrite so a learner audience can understand easily. Short sentences, plain words.",
      formal: "Rewrite in a formal, professional academic register suitable for teacher documentation.",
      friendly: "Rewrite in a warm, encouraging classroom voice appropriate for students.",
      shorten: "Rewrite significantly shorter while preserving key meaning.",
      expand: "Expand with clearer explanations, examples, and transitions.",
      grammar: "Fix grammar, spelling, punctuation, and awkward phrasing without changing meaning.",
    };
    const output = await callAiText({
      system:
        "You are TALA, a bilingual (English/Filipino) editorial assistant for Filipino teachers. Preserve the original language of the input unless the user clearly requests otherwise. Return ONLY the rewritten text — no preface, no explanations.",
      user: `Task: ${styles[data.style]}
Audience: ${data.audience}

TEXT:
"""
${data.text}
"""`,
    });
    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Text Rewriter",
      details: data.style,
    });
    return { output: output.trim() };
  });

const TranslateInput = z.object({
  text: z.string().min(1).max(6000),
  target: z.string().min(2).max(60),
  formality: z.enum(["neutral", "formal", "informal"]).default("neutral"),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TranslateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAiText } = await import("./ai-gateway.server");
    const output = await callAiText({
      system:
        "You are TALA, a precise translator for Filipino teachers. Translate faithfully, preserving educational terminology (MELC, DLL, TOS, etc.). Return ONLY the translated text — no notes, no quotes, no preface.",
      user: `Translate the following text to ${data.target} (${data.formality} register):

"""
${data.text}
"""`,
    });
    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Text Translator",
      details: data.target,
    });
    return { output: output.trim() };
  });
