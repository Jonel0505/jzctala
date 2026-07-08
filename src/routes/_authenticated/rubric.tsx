import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { generateRubric, type RubricContent } from "@/lib/tala-tools.functions";
import { Award, Loader2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadTextFile } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/rubric")({
  head: () => ({ meta: [{ title: "Rubric Maker — TALA" }, { name: "robots", content: "noindex" }] }),
  component: RubricPage,
});

function RubricPage() {
  const [form, setForm] = useState({
    activity: "",
    subject: "",
    grade: "",
    rubric_type: "analytic" as "analytic" | "holistic" | "single_point" | "checklist",
    levels: 4,
  });
  const [result, setResult] = useState<RubricContent | null>(null);
  const fn = useServerFn(generateRubric);
  const mut = useMutation({
    mutationFn: (d: typeof form) => fn({ data: d }),
    onSuccess: (r) => {
      setResult(r);
      toast.success("Rubric generated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadMd = () => {
    if (!result) return;
    const lines = [`# ${result.title}`, ``, `**Type:** ${result.rubric_type}`, ``, `| Criterion | Weight | ${result.level_labels.join(" | ")} |`, `|---|---|${result.level_labels.map(() => "---").join("|")}|`];
    result.rows.forEach((r) => {
      lines.push(`| ${r.criterion} | ${r.weight}% | ${r.descriptors.join(" | ")} |`);
    });
    if (result.notes) lines.push(``, `**Notes:** ${result.notes}`);
    downloadTextFile(`${result.title}.md`, lines.join("\n"));
  };

  return (
    <AppShell title="Rubric Maker">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate(form);
          }}
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Rubric</h2>
              <p className="text-sm text-muted-foreground">Pick the type — TALA writes the criteria and descriptors.</p>
            </div>
          </div>
          <F label="Activity / Task">
            <input required className="input" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} placeholder="e.g. Group science investigation on plant growth" />
          </F>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Subject (optional)">
              <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </F>
            <F label="Grade (optional)">
              <input className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </F>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Rubric Type">
              <select className="input" value={form.rubric_type} onChange={(e) => setForm({ ...form, rubric_type: e.target.value as typeof form.rubric_type })}>
                <option value="analytic">Analytic — separate criteria</option>
                <option value="holistic">Holistic — single overall score</option>
                <option value="single_point">Single-Point — proficient anchor</option>
                <option value="checklist">Checklist — met / not met</option>
              </select>
            </F>
            <F label="Performance Levels">
              <select className="input" value={form.levels} onChange={(e) => setForm({ ...form, levels: Number(e.target.value) })}>
                {[3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} levels
                  </option>
                ))}
              </select>
            </F>
          </div>
          <button disabled={mut.isPending} className="btn-primary flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mut.isPending ? "Generating..." : "Generate Rubric"}
          </button>
        </form>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">{result?.title ?? "Result"}</h3>
            {result && (
              <button onClick={downloadMd} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-muted">
                <Download className="h-4 w-4" /> Download
              </button>
            )}
          </div>
          {!result && <p className="text-sm text-muted-foreground">Your rubric will appear here.</p>}
          {result && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Criterion</th>
                    <th className="border p-2 text-left">Weight</th>
                    {result.level_labels.map((l) => (
                      <th key={l} className="border p-2 text-left">
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i}>
                      <td className="border p-2 font-semibold">{r.criterion}</td>
                      <td className="border p-2">{r.weight}%</td>
                      {r.descriptors.map((d, j) => (
                        <td key={j} className="border p-2 align-top">
                          {d}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.notes && <p className="mt-3 text-xs italic text-muted-foreground">{result.notes}</p>}
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
