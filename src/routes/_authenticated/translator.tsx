import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { translateText } from "@/lib/tala-tools.functions";
import { Languages, Loader2, ArrowRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const LANGS = [
  "Filipino / Tagalog",
  "English",
  "Cebuano / Bisaya",
  "Ilocano",
  "Hiligaynon",
  "Bikol",
  "Waray",
  "Kapampangan",
  "Pangasinense",
  "Chavacano",
  "Spanish",
  "Chinese (Simplified)",
  "Japanese",
  "Korean",
  "Arabic",
];

export const Route = createFileRoute("/_authenticated/translator")({
  head: () => ({ meta: [{ title: "Text Translator — TALA" }, { name: "robots", content: "noindex" }] }),
  component: TranslatorPage,
});

function TranslatorPage() {
  const [text, setText] = useState("");
  const [target, setTarget] = useState("Filipino / Tagalog");
  const [formality, setFormality] = useState<"neutral" | "formal" | "informal">("neutral");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const fn = useServerFn(translateText);
  const mut = useMutation({
    mutationFn: () => fn({ data: { text, target, formality } }),
    onSuccess: (r) => setOutput(r.output),
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell title="Text Translator">
      <div className="p-6 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Text Translator</h1>
            <p className="text-sm text-muted-foreground">Bilingual and multi-Philippine-language support.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Translate to</span>
            <select className="input w-56" value={target} onChange={(e) => setTarget(e.target.value)}>
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Tone</span>
            <select className="input w-40" value={formality} onChange={(e) => setFormality(e.target.value as typeof formality)}>
              <option value="neutral">Neutral</option>
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
            </select>
          </div>
          <button onClick={() => mut.mutate()} disabled={mut.isPending || !text.trim()} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {mut.isPending ? "Translating..." : "Translate"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Source</div>
            <textarea
              rows={14}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text here…"
              className="w-full resize-none rounded-lg border bg-card p-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Translation</div>
              {output && (
                <button onClick={copy} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold hover:bg-muted">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <div className="min-h-[280px] whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">
              {output || <span className="text-muted-foreground">Translation appears here.</span>}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .input { display:inline-block; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-card); padding:0.4rem 0.6rem; font-size:0.85rem; }
      `}</style>
    </AppShell>
  );
}
