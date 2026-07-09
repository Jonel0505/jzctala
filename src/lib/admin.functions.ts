import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin required");
}

export const listPendingUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [{ data: profiles, error }, { data: devices }] = await Promise.all([
      context.supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      (context.supabase as any).from("user_devices").select("*").order("first_seen", { ascending: true }),
    ]);
    if (error) throw new Error(error.message);
    const devMap: Record<string, any[]> = {};
    for (const d of (devices ?? []) as any[]) {
      (devMap[d.user_id] ||= []).push(d);
    }
    return (profiles ?? []).map((p: any) => ({ ...p, devices: devMap[p.id] ?? [] }));
  });

export const removeUserDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ device_row_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("user_devices").delete().eq("id", data.device_row_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const StatusUpdate = z.object({
  user_id: z.string().uuid(),
  status: z.enum(["pending", "approved", "denied", "disabled"]),
  reason: z.string().optional(),
});

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StatusUpdate.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        status: data.status,
        denial_reason: data.status === "denied" ? data.reason ?? null : null,
      })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);

    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: `Admin set user ${data.status}`,
      details: data.reason ?? null,
    });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "Admin deleted user",
      details: data.user_id,
    });
    return { ok: true };
  });

export const promoteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.user_id, role: "admin" });
    if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [users, pending, plans, tos, asmts] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      context.supabase.from("lesson_plans").select("id", { count: "exact", head: true }),
      context.supabase.from("tos").select("id", { count: "exact", head: true }),
      context.supabase.from("assessments").select("id", { count: "exact", head: true }),
    ]);
    return {
      users: users.count ?? 0,
      pending: pending.count ?? 0,
      lesson_plans: plans.count ?? 0,
      tos: tos.count ?? 0,
      assessments: asmts.count ?? 0,
    };
  });

export const listActivityLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

const SettingUpsert = z.object({
  key: z.string().min(1).max(80),
  value: z.record(z.any()),
});
export const upsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SettingUpsert.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("website_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setModuleEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ key: z.string().min(1), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("portal_modules")
      .update({ enabled: data.enabled })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AnnouncementInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().max(4000),
  published: z.boolean().default(true),
});
export const upsertAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnnouncementInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = { title: data.title, body: data.body, published: data.published };
    if (data.id) {
      const { error } = await context.supabase.from("announcements").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("announcements").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
