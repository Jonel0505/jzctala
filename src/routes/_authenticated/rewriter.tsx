import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { rewriteText } from "@/lib/tala-tools.functions";
import { RefreshCw, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/rewriter")({
  head: () => ({ meta: [{ title: "Text Rewriter — TALA" }, { name: "robots", content: "noindex" }] }),
  component: RewriterPage,
});

function RewriterPage() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<"simplify" | "formal" | "friendly" | "shorten" | "expand" | "grammar">("simplify");
  const [audience, setAudience] = useState("students");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const fn = useServerFn(rewriteText);
  const mut = useMutation({
    mutationFn: () => fn({ data: { text, style, audience } }),
    onSuccess: (r) => setOutput(r.output),
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell title="Text Rewriter">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Rewrite Text</h2>
              <p className="text-sm text-muted-foreground">Rework any passage — English or Filipino.</p>
            </div>
          </div>
          <label className="block">
            <div className="mb-1.5 text-xs font-semibold text-muted-foreground">Text to rewrite</div>
            <textarea
              required
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border bg-card p-3 text-sm outline-none focus:border-primary"
              placeholder="Paste any paragraph, lesson note, memo, or instruction here…"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">Style</div>
              <select className="input" value={style} onChange={(e) => setStyle(e.target.value as typeof style)}>
                <option value="simplify">Simplify for learners</option>
                <option value="formal">Formal / academic</option>
                <option value="friendly">Warm & friendly</option>
                <option value="shorten">Shorten</option>
                <option value="expand">Expand with detail</option>
                <option value="grammar">Fix grammar only</option>
              </select>
            </label>
            <label className="block">
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">Audience</div>
              <input className="input" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </label>
          </div>
          <button disabled={mut.isPending || !text.trim()} className="btn-primary flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {mut.isPending ? "Rewriting..." : "Rewrite"}
          </button>
        </form>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">Result</h3>
            {output && (
              <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-muted">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          {!output && <p className="text-sm text-muted-foreground">Rewritten text will appear here.</p>}
          {output && <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">{output}</div>}
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
