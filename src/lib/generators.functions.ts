import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LessonPlanInput = z.object({
  subject: z.string().min(1).max(120),
  grade: z.string().min(1).max(40),
  topic: z.string().min(1).max(300),
  duration: z.string().min(1).max(60),
  objectives: z.string().max(1000).optional().default(""),
});

export interface LessonPlanContent {
  title: string;
  objectives: string[];
  materials: string[];
  introduction: string;
  lesson: string;
  activities: string[];
  assessment: string;
  wrap_up: string;
}

export const generateLessonPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LessonPlanInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAiJson } = await import("./ai-gateway.server");
    const plan = await callAiJson<LessonPlanContent>({
      system:
        "You are TALA, an assistant for Filipino public school teachers. Generate an ILAW-format lesson plan (Introduction, Lesson proper, Activities, Wrap-up).",
      user: `Create a lesson plan for:
Subject: ${data.subject}
Grade Level: ${data.grade}
Topic: ${data.topic}
Duration: ${data.duration}
Learning objectives (optional): ${data.objectives || "Derive appropriate objectives"}

Return JSON with keys: title (string), objectives (string[]), materials (string[]), introduction (string), lesson (string), activities (string[]), assessment (string), wrap_up (string).`,
    });

    const { error, data: row } = await context.supabase
      .from("lesson_plans")
      .insert({
        user_id: context.userId,
        title: plan.title || `${data.subject} — ${data.topic}`,
        subject: data.subject,
        grade: data.grade,
        content: plan as unknown as Record<string, unknown>,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Generated Lesson Plan",
      details: plan.title,
    });

    return row;
  });

const TosInput = z.object({
  subject: z.string().min(1).max(120),
  grade: z.string().min(1).max(40),
  total_items: z.number().int().min(5).max(200),
  topics: z
    .array(z.object({ name: z.string().min(1).max(200), weight: z.number().min(1).max(100) }))
    .min(1)
    .max(20),
});

export interface TosRow {
  topic: string;
  no_of_items: number;
  remembering: number;
  understanding: number;
  applying: number;
  analyzing: number;
  evaluating: number;
  creating: number;
  placement: string;
}
export interface TosContent {
  title: string;
  rows: TosRow[];
}

export const generateTos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TosInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAiJson } = await import("./ai-gateway.server");
    const tos = await callAiJson<TosContent>({
      system:
        "You are TALA. Build a Table of Specifications following Bloom's taxonomy (remembering, understanding, applying, analyzing, evaluating, creating). Distribute items by weight so counts sum to total_items.",
      user: `Build a Table of Specifications:
Subject: ${data.subject}
Grade: ${data.grade}
Total items: ${data.total_items}
Topics (with weights that sum to ~100): ${JSON.stringify(data.topics)}

Return JSON: { title: string, rows: [{ topic, no_of_items, remembering, understanding, applying, analyzing, evaluating, creating, placement }] } where placement is like "1-5". Ensure sums match no_of_items per row and total items overall.`,
    });

    const { error, data: row } = await context.supabase
      .from("tos")
      .insert({
        user_id: context.userId,
        title: tos.title || `TOS — ${data.subject} ${data.grade}`,
        subject: data.subject,
        grade: data.grade,
        table_data: tos as unknown as Record<string, unknown>,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Generated TOS",
      details: tos.title,
    });
    return row;
  });

const AssessmentInput = z.object({
  subject: z.string().min(1).max(120),
  grade: z.string().min(1).max(40),
  topic: z.string().min(1).max(300),
  item_type: z.enum(["multiple_choice", "true_false", "short_answer"]),
  count: z.number().int().min(1).max(50),
});

export interface AssessmentItem {
  question: string;
  choices?: string[];
  answer: string;
  explanation?: string;
}
export interface AssessmentContent {
  title: string;
  items: AssessmentItem[];
}

export const generateAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AssessmentInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAiJson } = await import("./ai-gateway.server");
    const asmt = await callAiJson<AssessmentContent>({
      system:
        "You are TALA. Create fair, curriculum-appropriate assessment items for Filipino public school teachers.",
      user: `Create ${data.count} ${data.item_type.replace("_", " ")} items:
Subject: ${data.subject}
Grade: ${data.grade}
Topic: ${data.topic}

Return JSON: { title: string, items: [{ question, ${data.item_type === "multiple_choice" ? "choices (4 strings), " : ""}answer, explanation }] }.`,
    });

    const { error, data: row } = await context.supabase
      .from("assessments")
      .insert({
        user_id: context.userId,
        title: asmt.title || `Assessment — ${data.topic}`,
        subject: data.subject,
        grade: data.grade,
        items: asmt.items as unknown as Record<string, unknown>[],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Generated Assessment",
      details: asmt.title,
    });
    return row;
  });
