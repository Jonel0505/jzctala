import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { getSiteContent } from "@/lib/public.functions";
import { setModuleEnabled } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/modules")({
  head: () => ({ meta: [{ title: "Portal Management — TALA Admin" }, { name: "robots", content: "noindex" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const fetchSite = useServerFn(getSiteContent);
  const set = useServerFn(setModuleEnabled);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });
  const mut = useMutation({
    mutationFn: (v: { key: string; enabled: boolean }) => set({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["site"] }); qc.invalidateQueries({ queryKey: ["site-public"] }); toast.success("Updated."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell title="Portal Management">
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-extrabold">Portal Modules</h1>
        <p className="text-sm text-muted-foreground">Enable or disable modules for all teachers.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {(data?.modules ?? []).map((m) => (
            <label key={m.key} className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm">
              <div>
                <div className="font-semibold">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.enabled ? "Enabled" : "Disabled"}</div>
              </div>
              <input type="checkbox" checked={m.enabled} onChange={(e) => mut.mutate({ key: m.key, enabled: e.target.checked })} className="h-5 w-5 accent-primary" />
            </label>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
