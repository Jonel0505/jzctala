import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile, error }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).single(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    if (error) throw new Error(error.message);
    return {
      profile,
      roles: (roles ?? []).map((r: { role: string }) => r.role),
    };
  });

export const setMyAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ avatar_url: z.string().max(500).nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ avatar_url: data.avatar_url })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ current_password: z.string().min(1), new_password: z.string().min(8).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Verify current password by attempting a sign-in with a fresh client
    const { createClient } = await import("@supabase/supabase-js");
    const email = context.claims?.email as string | undefined;
    if (!email) throw new Error("No email on session");
    const verifier = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } },
    );
    const { error: signErr } = await verifier.auth.signInWithPassword({
      email,
      password: data.current_password,
    });
    if (signErr) throw new Error("Current password is incorrect");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.new_password,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Changed password",
    });
    return { ok: true };
  });

const ProfileUpdate = z.object({
  first_name: z.string().max(80),
  middle_name: z.string().max(80).optional(),
  last_name: z.string().max(80),
  school: z.string().max(120).optional(),
  division: z.string().max(120).optional(),
  region: z.string().max(120).optional(),
  position: z.string().max(120).optional(),
  employee_id: z.string().max(80).optional(),
});
export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileUpdate.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [plans, tos, asmts] = await Promise.all([
      context.supabase.from("lesson_plans").select("id,title,subject,grade,created_at,content").eq("user_id", context.userId).order("created_at", { ascending: false }),
      context.supabase.from("tos").select("id,title,subject,grade,created_at,table_data").eq("user_id", context.userId).order("created_at", { ascending: false }),
      context.supabase.from("assessments").select("id,title,subject,grade,created_at,items").eq("user_id", context.userId).order("created_at", { ascending: false }),
    ]);
    return {
      lesson_plans: plans.data ?? [],
      tos: tos.data ?? [],
      assessments: asmts.data ?? [],
    };
  });

export const listMyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ kind: z.enum(["lesson_plans", "tos", "assessments"]), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from(data.kind)
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
