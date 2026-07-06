import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { generateLessonPlan, type LessonPlanContent } from "@/lib/generators.functions";
import { Loader2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { downloadTextFile } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/lesson-plans")({
  head: () => ({ meta: [{ title: "Lesson Plan Generator — TALA" }, { name: "robots", content: "noindex" }] }),
  component: LessonPlanPage,
});

function LessonPlanPage() {
  const [form, setForm] = useState({ subject: "", grade: "", topic: "", duration: "60 minutes", objectives: "" });
  const [plan, setPlan] = useState<LessonPlanContent | null>(null);
  const qc = useQueryClient();
  const fn = useServerFn(generateLessonPlan);
  const mut = useMutation({
    mutationFn: (data: typeof form) => fn({ data }),
    onSuccess: (row) => {
      setPlan(row.content as unknown as LessonPlanContent);
      qc.invalidateQueries({ queryKey: ["my-activity"] });
      qc.invalidateQueries({ queryKey: ["my-docs"] });
      toast.success("Lesson plan generated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = () => {
    if (!plan) return;
    const md = `# ${plan.title}\n\n## Objectives\n${plan.objectives.map((o) => `- ${o}`).join("\n")}\n\n## Materials\n${plan.materials.map((m) => `- ${m}`).join("\n")}\n\n## Introduction\n${plan.introduction}\n\n## Lesson Proper\n${plan.lesson}\n\n## Activities\n${plan.activities.map((a) => `- ${a}`).join("\n")}\n\n## Assessment\n${plan.assessment}\n\n## Wrap-up\n${plan.wrap_up}\n`;
    downloadTextFile(`${plan.title}.md`, md);
  };

  return (
    <AppShell title="Lesson Plan Generator">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-bold">Create a Lesson Plan</h2>
            <p className="text-sm text-muted-foreground">Fill in the details and TALA will generate an ILAW-formatted plan.</p>
          </div>
          <F label="Subject"><input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Science" /></F>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Grade Level"><input required className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. Grade 7" /></F>
            <F label="Duration"><input required className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></F>
          </div>
          <F label="Topic"><input required className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Photosynthesis" /></F>
          <F label="Learning Objectives (optional)">
            <textarea rows={3} className="input" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="Leave blank for TALA to suggest." />
          </F>
          <button disabled={mut.isPending} className="btn-primary flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mut.isPending ? "Generating..." : "Generate Lesson Plan"}
          </button>
        </form>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Result</h2>
            {plan && (
              <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-muted">
                <Download className="h-4 w-4" /> Download
              </button>
            )}
          </div>
          {!plan && <p className="text-sm text-muted-foreground">Your generated lesson plan will appear here.</p>}
          {plan && (
            <article className="prose prose-sm max-w-none space-y-4">
              <h3 className="text-lg font-bold text-navy">{plan.title}</h3>
              <Section title="Objectives"><ul className="list-disc pl-5">{plan.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul></Section>
              <Section title="Materials"><ul className="list-disc pl-5">{plan.materials.map((m, i) => <li key={i}>{m}</li>)}</ul></Section>
              <Section title="Introduction"><p>{plan.introduction}</p></Section>
              <Section title="Lesson Proper"><p className="whitespace-pre-wrap">{plan.lesson}</p></Section>
              <Section title="Activities"><ul className="list-disc pl-5">{plan.activities.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>
              <Section title="Assessment"><p>{plan.assessment}</p></Section>
              <Section title="Wrap-up"><p>{plan.wrap_up}</p></Section>
            </article>
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
  return <label className="block"><div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>{children}</label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h4 className="text-sm font-bold uppercase tracking-wide text-primary">{title}</h4><div className="mt-1 text-sm">{children}</div></div>;
}
