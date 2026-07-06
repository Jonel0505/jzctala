import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { generateTos, type TosContent } from "@/lib/generators.functions";
import { Loader2, Plus, Trash2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTextFile } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/tos")({
  head: () => ({ meta: [{ title: "Automated TOS Portal — TALA" }, { name: "robots", content: "noindex" }] }),
  component: TosPage,
});

function TosPage() {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [total, setTotal] = useState(30);
  const [topics, setTopics] = useState([{ name: "", weight: 100 }]);
  const [result, setResult] = useState<TosContent | null>(null);
  const qc = useQueryClient();
  const fn = useServerFn(generateTos);
  const mut = useMutation({
    mutationFn: () => fn({ data: { subject, grade, total_items: total, topics } }),
    onSuccess: (row) => {
      setResult(row.table_data as unknown as TosContent);
      qc.invalidateQueries({ queryKey: ["my-activity"] });
      qc.invalidateQueries({ queryKey: ["my-docs"] });
      toast.success("TOS generated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = () => {
    if (!result) return;
    const header = "Topic,Items,Remember,Understand,Apply,Analyze,Evaluate,Create,Placement";
    const rows = result.rows.map((r) => [r.topic, r.no_of_items, r.remembering, r.understanding, r.applying, r.analyzing, r.evaluating, r.creating, r.placement].join(","));
    downloadTextFile(`${result.title}.csv`, [header, ...rows].join("\n"));
  };

  return (
    <AppShell title="Automated TOS Portal">
      <div className="p-6 md:p-8">
        <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold">Generate a Table of Specifications</h2>
          <p className="text-sm text-muted-foreground">Provide subject details and topics; TALA distributes items across Bloom's taxonomy.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <F label="Subject"><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" /></F>
            <F label="Grade"><input className="input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 7" /></F>
            <F label="Total Items"><input type="number" min={5} max={200} className="input" value={total} onChange={(e) => setTotal(Number(e.target.value))} /></F>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topics & Weights (%)</div>
              <button onClick={() => setTopics([...topics, { name: "", weight: 0 }])} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold hover:bg-muted">
                <Plus className="h-3 w-3" /> Add Topic
              </button>
            </div>
            <div className="space-y-2">
              {topics.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" placeholder="Topic name" value={t.name} onChange={(e) => setTopics(topics.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <input type="number" className="input w-24" placeholder="%" value={t.weight} onChange={(e) => setTopics(topics.map((x, j) => j === i ? { ...x, weight: Number(e.target.value) } : x))} />
                  {topics.length > 1 && (
                    <button onClick={() => setTopics(topics.filter((_, j) => j !== i))} className="grid place-items-center rounded-md border px-3 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button disabled={mut.isPending || !subject || !grade || topics.some((t) => !t.name)} onClick={() => mut.mutate()} className="btn-primary mt-5 flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mut.isPending ? "Generating..." : "Generate TOS"}
          </button>
        </div>

        {result && (
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{result.title}</h3>
              <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-muted">
                <Download className="h-4 w-4" /> CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase tracking-wide">
                  <tr>
                    {["Topic", "Items", "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create", "Placement"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-medium">{r.topic}</td>
                      <td className="px-3 py-2">{r.no_of_items}</td>
                      <td className="px-3 py-2">{r.remembering}</td>
                      <td className="px-3 py-2">{r.understanding}</td>
                      <td className="px-3 py-2">{r.applying}</td>
                      <td className="px-3 py-2">{r.analyzing}</td>
                      <td className="px-3 py-2">{r.evaluating}</td>
                      <td className="px-3 py-2">{r.creating}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.placement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .input { display:block; width:100%; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-card); padding:0.55rem 0.75rem; font-size:0.9rem; }
        .btn-primary { display:block; width:100%; border-radius:0.5rem; background:var(--color-primary); color:var(--color-primary-foreground); padding:0.7rem 1rem; font-weight:600; font-size:0.9rem; }
        .btn-primary:disabled { opacity:0.6; }
      `}</style>
    </AppShell>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>{children}</label>;
}
