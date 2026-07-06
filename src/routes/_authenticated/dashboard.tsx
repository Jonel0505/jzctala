import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { getMyProfile, listMyActivity } from "@/lib/user.functions";
import { getSiteContent } from "@/lib/public.functions";
import { ArrowRight, FileText, Table, ClipboardCheck, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TALA" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchActivity = useServerFn(listMyActivity);
  const fetchSite = useServerFn(getSiteContent);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: activity } = useQuery({ queryKey: ["my-activity"], queryFn: () => fetchActivity() });
  const { data: site } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });
  const modules = new Set((site?.modules ?? []).filter((m) => m.enabled).map((m) => m.key));

  return (
    <AppShell title="Dashboard">
      <div className="p-6 md:p-8">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 md:p-10">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Welcome to</p>
            <h1 className="mt-1 text-5xl font-extrabold tracking-tight text-navy md:text-6xl">TALA</h1>
            <p className="mt-2 text-lg font-semibold text-primary">Hello, {me?.profile?.first_name || "Teacher"}!</p>
            <p className="mt-2 max-w-md text-muted-foreground">
              Streamline your teaching tasks with intelligent automation. Create, generate, and manage with ease.
            </p>
            <Link
              to="/lesson-plans"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground shadow hover:bg-navy/90"
            >
              Let's Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Sparkles className="pointer-events-none absolute right-8 top-6 h-40 w-40 text-primary/10" />
        </section>

        {/* Quick actions */}
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.has("tos") && (
            <QuickCard to="/tos" title="Automated TOS Portal" description="Generate curriculum-aligned Tables of Specification instantly." cta="Open Portal" icon={Table} accent="success" />
          )}
          {modules.has("lesson_plan") && (
            <QuickCard to="/lesson-plans" title="Lesson Plan Generator" description="Create ILAW-formatted lesson plans quickly and efficiently." cta="Open Generator" icon={FileText} accent="primary" />
          )}
          {modules.has("assessment") && (
            <QuickCard to="/assessments" title="Assessment Generator" description="Design fair, standards-aligned assessments in seconds." cta="Open Generator" icon={ClipboardCheck} accent="warning" />
          )}
        </div>

        {/* Recent activity */}
        <section className="mt-8 rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <Link to="/documents" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>
          {(!activity || activity.length === 0) && (
            <p className="text-sm text-muted-foreground">No activity yet. Try generating your first lesson plan.</p>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {(activity ?? []).slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{a.action}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.details ?? ""} · {formatDate(a.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function QuickCard({ to, title, description, cta, icon: Icon, accent }: {
  to: string; title: string; description: string; cta: string; icon: React.ElementType;
  accent: "primary" | "success" | "warning";
}) {
  const bg = accent === "success" ? "bg-success/15 text-success" : accent === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-primary/15 text-primary";
  const btn = accent === "success" ? "bg-success text-success-foreground" : accent === "warning" ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground";
  return (
    <div className="group flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${bg}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <Link to={to} className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${btn}`}>
          {cta} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
