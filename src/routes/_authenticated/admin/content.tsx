import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { getSiteContent } from "@/lib/public.functions";
import { upsertSetting } from "@/lib/admin.functions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({ meta: [{ title: "Website Content — TALA Admin" }, { name: "robots", content: "noindex" }] }),
  component: ContentPage,
});

const SCHEMA: { key: string; label: string; fields: { name: string; type: "text" | "textarea"; label: string }[] }[] = [
  { key: "hero", label: "Hero Section", fields: [
    { name: "title", type: "text", label: "Title" },
    { name: "subtitle", type: "textarea", label: "Subtitle" },
    { name: "cta", type: "text", label: "Call-to-action label" },
  ]},
  { key: "mission", label: "Mission", fields: [{ name: "text", type: "textarea", label: "Mission" }]},
  { key: "vision", label: "Vision", fields: [{ name: "text", type: "textarea", label: "Vision" }]},
  { key: "about", label: "About", fields: [{ name: "text", type: "textarea", label: "About" }]},
  { key: "contact", label: "Contact Info", fields: [
    { name: "email", type: "text", label: "Email" },
    { name: "phone", type: "text", label: "Phone" },
  ]},
  { key: "footer", label: "Footer", fields: [{ name: "text", type: "text", label: "Footer text" }]},
];

function ContentPage() {
  const fetchSite = useServerFn(getSiteContent);
  const save = useServerFn(upsertSetting);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (data?.settings) {
      const next: Record<string, Record<string, string>> = {};
      for (const s of SCHEMA) {
        next[s.key] = {};
        for (const f of s.fields) next[s.key][f.name] = (data.settings[s.key]?.[f.name] as string) ?? "";
      }
      setValues(next);
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: (v: { key: string; value: Record<string, string> }) => save({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["site"] }); qc.invalidateQueries({ queryKey: ["site-public"] }); toast.success("Saved."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell title="Website Content Management">
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-extrabold">Website Content</h1>
        <p className="text-sm text-muted-foreground">Edit the public-facing site without touching code.</p>

        <div className="mt-6 space-y-5">
          {SCHEMA.map((sec) => (
            <div key={sec.key} className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">{sec.label}</h3>
              <div className="grid gap-3">
                {sec.fields.map((f) => (
                  <label key={f.name} className="block">
                    <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{f.label}</div>
                    {f.type === "textarea" ? (
                      <textarea rows={3} value={values[sec.key]?.[f.name] ?? ""} onChange={(e) => setValues({ ...values, [sec.key]: { ...values[sec.key], [f.name]: e.target.value } })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                    ) : (
                      <input type="text" value={values[sec.key]?.[f.name] ?? ""} onChange={(e) => setValues({ ...values, [sec.key]: { ...values[sec.key], [f.name]: e.target.value } })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button disabled={mut.isPending} onClick={() => mut.mutate({ key: sec.key, value: values[sec.key] ?? {} })} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save {sec.label}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
