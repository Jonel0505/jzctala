import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { generateLAS, type LasContent } from "@/lib/tala-tools.functions";
import { Loader2, Sparkles, Download, Layers } from "lucide-react";
import { toast } from "sonner";
import { downloadTextFile } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/las")({
  head: () => ({ meta: [{ title: "Learning Activity Sheet Maker — TALA" }, { name: "robots", content: "noindex" }] }),
  component: LasPage,
});

function LasPage() {
  const [form, setForm] = useState({ subject: "", grade: "", topic: "", melc: "", duration: "45 minutes" });
  const [result, setResult] = useState<LasContent | null>(null);
  const fn = useServerFn(generateLAS);
  const mut = useMutation({
    mutationFn: (d: typeof form) => fn({ data: d }),
    onSuccess: (r) => { setResult(r); toast.success("LAS generated!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = () => {
    if (!result) return;
    const lines = [
      `# ${result.title}`,
      ``,
      `**Learning Competency:** ${result.learning_competency}`,
      ``,
      `## Objectives`,
      ...result.objectives.map((o) => `- ${o}`),
      ``,
      `## Concept Notes`,
      result.concept_notes,
      ``,
      `## Guided Practice`,
      result.guided_practice.instruction,
      ...result.guided_practice.items.map((i, n) => `${n + 1}. ${i}`),
      ``,
      `## Independent Practice`,
      result.independent_practice.instruction,
      ...result.independent_practice.items.map((i, n) => `${n + 1}. ${i}`),
      ``,
      `## Assessment`,
      result.assessment.instruction,
      ...result.assessment.items.map((i, n) => `${n + 1}. ${i}`),
      ``,
      `## Answer Key`,
      ...result.answer_key.map((a, n) => `${n + 1}. ${a}`),
      ``,
      `## Reflection`,
      result.reflection,
    ];
    downloadTextFile(`${result.title}.md`, lines.join("\n"));
  };

  return (
    <AppShell title="Learning Activity Sheet (LAS) Maker">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600"><Layers className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Create LAS</h2>
              <p className="text-xs text-muted-foreground">MATATAG & MELC-aligned learning activity sheet.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Subject"><input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="Grade Level"><input required className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></Field>
          </div>
          <Field label="Topic"><input required className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
          <Field label="MELC (optional)"><input className="input" value={form.melc} onChange={(e) => setForm({ ...form, melc: e.target.value })} /></Field>
          <Field label="Duration"><input className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
          <button disabled={mut.isPending} className="btn-primary flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mut.isPending ? "Generating..." : "Generate LAS"}
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
            <p className="text-sm text-muted-foreground">Your Learning Activity Sheet will appear here.</p>
          ) : (
            <div className="space-y-4 text-sm">
              <Section title="Learning Competency"><p>{result.learning_competency}</p></Section>
              <Section title="Objectives"><ul className="list-disc pl-5">{result.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul></Section>
              <Section title="Concept Notes"><p className="whitespace-pre-wrap">{result.concept_notes}</p></Section>
              <Section title="Guided Practice">
                <p className="italic text-muted-foreground">{result.guided_practice.instruction}</p>
                <ol className="mt-1 list-decimal pl-5">{result.guided_practice.items.map((i, n) => <li key={n}>{i}</li>)}</ol>
              </Section>
              <Section title="Independent Practice">
                <p className="italic text-muted-foreground">{result.independent_practice.instruction}</p>
                <ol className="mt-1 list-decimal pl-5">{result.independent_practice.items.map((i, n) => <li key={n}>{i}</li>)}</ol>
              </Section>
              <Section title="Assessment">
                <p className="italic text-muted-foreground">{result.assessment.instruction}</p>
                <ol className="mt-1 list-decimal pl-5">{result.assessment.items.map((i, n) => <li key={n}>{i}</li>)}</ol>
              </Section>
              <Section title="Answer Key">
                <ol className="list-decimal pl-5">{result.answer_key.map((a, n) => <li key={n}>{a}</li>)}</ol>
              </Section>
              <Section title="Reflection"><p>{result.reflection}</p></Section>
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
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-primary">{title}</div>
      {children}
    </div>
  );
}
