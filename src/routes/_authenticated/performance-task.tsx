import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { generatePerformanceTask, type PerformanceTaskContent } from "@/lib/tala-tools.functions";
import { Loader2, Sparkles, Download, Trophy } from "lucide-react";
import { toast } from "sonner";
import { downloadTextFile } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/performance-task")({
  head: () => ({ meta: [{ title: "Performance Task Maker — TALA" }, { name: "robots", content: "noindex" }] }),
  component: PtPage,
});

function PtPage() {
  const [form, setForm] = useState({ subject: "", grade: "", topic: "", quarter: "" });
  const [result, setResult] = useState<PerformanceTaskContent | null>(null);
  const fn = useServerFn(generatePerformanceTask);
  const mut = useMutation({
    mutationFn: (d: typeof form) => fn({ data: d }),
    onSuccess: (r) => { setResult(r); toast.success("Performance task generated!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = () => {
    if (!result) return;
    const lines = [
      `# ${result.title}`,
      ``,
      `## GRASPS`,
      `**Goal:** ${result.goal}`,
      `**Role:** ${result.role}`,
      `**Audience:** ${result.audience}`,
      `**Situation:** ${result.situation}`,
      `**Product/Performance:** ${result.product}`,
      `**Standards:**`,
      ...result.standards.map((s) => `- ${s}`),
      ``,
      `## Procedure`,
      ...result.procedure.map((p, i) => `${i + 1}. ${p}`),
      ``,
      `## Rubric (${result.level_labels.join(" / ")})`,
      ...result.rubric.map((r) => `- **${r.criterion} (${r.weight}%)** — ${r.descriptors.map((d, i) => `${result.level_labels[i]}: ${d}`).join(" | ")}`),
    ];
    downloadTextFile(`${result.title}.md`, lines.join("\n"));
  };

  return (
    <AppShell title="Performance Task Maker">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600"><Trophy className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Create Performance Task</h2>
              <p className="text-xs text-muted-foreground">Authentic GRASPS-framework task with rubric.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Subject"><input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="Grade Level"><input required className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></Field>
          </div>
          <Field label="Topic / Unit"><input required className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
          <Field label="Quarter (optional)"><input className="input" value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })} /></Field>
          <button disabled={mut.isPending} className="btn-primary flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mut.isPending ? "Generating..." : "Generate Performance Task"}
          </button>
        </form>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">{result?.title ?? "Result"}</h3>
            {result && (
              <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            )}
          </div>
          {!result ? (
            <p className="text-sm text-muted-foreground">Your Performance Task will appear here.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <Cell label="Goal">{result.goal}</Cell>
                <Cell label="Role">{result.role}</Cell>
                <Cell label="Audience">{result.audience}</Cell>
                <Cell label="Situation">{result.situation}</Cell>
                <Cell label="Product/Performance">{result.product}</Cell>
                <Cell label="Standards"><ul className="list-disc pl-4">{result.standards.map((s, i) => <li key={i}>{s}</li>)}</ul></Cell>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-primary">Procedure</div>
                <ol className="list-decimal pl-5">{result.procedure.map((p, i) => <li key={i}>{p}</li>)}</ol>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Criterion</th>
                      <th className="p-2 text-left">%</th>
                      {result.level_labels.map((l) => <th key={l} className="p-2 text-left">{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rubric.map((r, i) => (
                      <tr key={i} className="border-t align-top">
                        <td className="p-2 font-semibold">{r.criterion}</td>
                        <td className="p-2">{r.weight}</td>
                        {r.descriptors.map((d, j) => <td key={j} className="p-2">{d}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .input { display:block; width:100%; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-card); padding:0.55rem 0.75rem; font-size:0.9rem; }
        .btn-primary { display:block; width:100%; border-radius:0.5rem; background:var(--color-primary); color:var(--color-primary-foreground); padding:0.7rem 1rem; font-weight:600; font-size:0.9rem; }
        .btn-primary:disabled { opacity:0.6; }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>{children}</label>;
}
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">{label}</div>
      <div>{children}</div>
    </div>
  );
}
