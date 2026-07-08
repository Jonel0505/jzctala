import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { generateAssessment, type AssessmentContent } from "@/lib/generators.functions";
import { Loader2, Sparkles, Download, Eye, EyeOff, FileText } from "lucide-react";
import { toast } from "sonner";
import { downloadTextFile } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/assessments")({
  head: () => ({ meta: [{ title: "Assessment Maker — TALA" }, { name: "robots", content: "noindex" }] }),
  component: AssessmentPage,
});

function assessmentToHtml(result: AssessmentContent, showExplanations: boolean) {
  const items = result.items
    .map((it, i) => {
      const choices = it.choices
        ? `<ol type="A" style="margin:4px 0 4px 24px;">${it.choices
            .map((c) => `<li>${escapeHtml(c)}</li>`)
            .join("")}</ol>`
        : "";
      const expl =
        showExplanations && it.explanation
          ? `<p style="color:#555;margin:2px 0 0 0;"><em>Explanation:</em> ${escapeHtml(it.explanation)}</p>`
          : "";
      return `<div style="margin-bottom:10px;">
        <p style="margin:0;"><strong>${i + 1}.</strong> ${escapeHtml(it.question)}</p>
        ${choices}
        <p style="margin:2px 0 0 0;"><strong>Answer:</strong> ${escapeHtml(it.answer)}</p>
        ${expl}
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="utf-8"><title>${escapeHtml(result.title)}</title>
  <style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111;} h1{font-size:16pt;margin:0 0 12px 0;}</style>
  </head><body>
  <h1>${escapeHtml(result.title)}</h1>
  <p><em>Answer Key ${showExplanations ? "with explanations" : "(explanations hidden)"}</em></p>
  <hr/>
  ${items}
  </body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function AssessmentPage() {
  const [form, setForm] = useState({
    subject: "",
    grade: "",
    topic: "",
    item_type: "multiple_choice" as "multiple_choice" | "true_false" | "short_answer",
    count: 10,
  });
  const [result, setResult] = useState<AssessmentContent | null>(null);
  const [showExpl, setShowExpl] = useState(true);
  const qc = useQueryClient();
  const fn = useServerFn(generateAssessment);
  const mut = useMutation({
    mutationFn: (d: typeof form) => fn({ data: d }),
    onSuccess: (row) => {
      setResult({ title: row.title, items: row.items as unknown as AssessmentContent["items"] });
      qc.invalidateQueries({ queryKey: ["my-activity"] });
      qc.invalidateQueries({ queryKey: ["my-docs"] });
      toast.success("Assessment generated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadMd = () => {
    if (!result) return;
    const lines: string[] = [`# ${result.title}\n`];
    result.items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.question}`);
      if (it.choices) it.choices.forEach((c, j) => lines.push(`   ${String.fromCharCode(65 + j)}. ${c}`));
      lines.push(`   Answer: ${it.answer}`);
      if (showExpl && it.explanation) lines.push(`   Explanation: ${it.explanation}`);
      lines.push("");
    });
    downloadTextFile(`${result.title}.md`, lines.join("\n"));
  };

  const downloadDocx = () => {
    if (!result) return;
    const html = assessmentToHtml(result, showExpl);
    // .doc extension with HTML content — MS Word opens it as a Word document.
    downloadBlob(`${result.title}.doc`, html, "application/msword");
  };

  return (
    <AppShell title="Assessment Maker">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate(form);
          }}
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-bold">Create Assessment</h2>
            <p className="text-sm text-muted-foreground">TALA will produce items with an answer key.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Subject">
              <input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </F>
            <F label="Grade">
              <input required className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </F>
          </div>
          <F label="Topic">
            <input required className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </F>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Item Type">
              <select className="input" value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value as typeof form.item_type })}>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </F>
            <F label="Number of Items">
              <input type="number" min={1} max={50} className="input" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
            </F>
          </div>
          <button disabled={mut.isPending} className="btn-primary flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mut.isPending ? "Generating..." : "Generate Assessment"}
          </button>
        </form>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">{result?.title ?? "Result"}</h3>
            {result && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowExpl((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  {showExpl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showExpl ? "Hide Explanations" : "Show Explanations"}
                </button>
                <button onClick={downloadMd} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                  <Download className="h-3.5 w-3.5" /> Markdown
                </button>
                <button
                  onClick={downloadDocx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <FileText className="h-3.5 w-3.5" /> Word Docx
                </button>
              </div>
            )}
          </div>
          {!result && <p className="text-sm text-muted-foreground">Assessment items will appear here.</p>}
          {result && (
            <ol className="space-y-4 text-sm">
              {result.items.map((it, i) => (
                <li key={i} className="rounded-lg border p-3">
                  <div className="font-semibold">
                    {i + 1}. {it.question}
                  </div>
                  {it.choices && (
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {it.choices.map((c, j) => (
                        <li key={j}>
                          {String.fromCharCode(65 + j)}. {c}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-success">Answer:</span> {it.answer}
                  </div>
                  {showExpl && it.explanation && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold">Explanation:</span> {it.explanation}
                    </div>
                  )}
                </li>
              ))}
            </ol>
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
