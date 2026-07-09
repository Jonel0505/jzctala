import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tala/AppShell";
import { BookOpenCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/class-record")({
  head: () => ({ meta: [{ title: "Automated Class Record — TALA" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AppShell title="Automated Class Record">
      <div className="p-6 md:p-10">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-sky-600">
            <BookOpenCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-navy">Automated Class Record</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track grades per learning area and auto-compute quarterly ratings following DepEd guidelines.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Coming soon — under development
          </div>
        </div>
      </div>
    </AppShell>
  ),
});
