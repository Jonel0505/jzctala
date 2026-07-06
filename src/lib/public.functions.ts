import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [{ data: settings }, { data: modules }, { data: announcements }] = await Promise.all([
    sb.from("website_settings").select("*"),
    sb.from("portal_modules").select("*").order("sort_order"),
    sb.from("announcements").select("*").eq("published", true).order("created_at", { ascending: false }).limit(5),
  ]);
  const settingsMap: Record<string, any> = {};
  for (const s of settings ?? []) settingsMap[s.key] = s.value as any;
  return {
    settings: settingsMap,
    modules: modules ?? [],
    announcements: announcements ?? [],
  };
});
