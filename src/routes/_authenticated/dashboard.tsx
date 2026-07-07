import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { getMyProfile, listMyActivity } from "@/lib/user.functions";
import { getSiteContent } from "@/lib/public.functions";
import {
  ArrowRight,
  FileText,
  Table as TableIcon,
  FileEdit,
  Presentation,
  ClipboardCheck,
  Award,
  RefreshCw,
  Languages,
  Users2,
  Bot,
  Rocket,
  Sparkles,
  Facebook,
  Twitter,
  Globe,
} from "lucide-react";
import { formatDate } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TALA" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Tool = {
  to: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string; // tailwind color name
  moduleKey?: string;
  disabled?: boolean;
};

const TOOLS: Tool[] = [
  { to: "/lesson-plans", title: "Lesson Plan Maker", desc: "Create ILAW-formatted lesson plans quickly and effortlessly.", icon: FileText, color: "emerald", moduleKey: "lesson_plan" },
  { to: "/tos", title: "Automated TOS with Test Generator", desc: "Generate curriculum-aligned TOS and automatically create tests.", icon: TableIcon, color: "violet", moduleKey: "tos" },
  { to: "/worksheet", title: "Worksheet Maker", desc: "Generate engaging worksheets tailored to your learning objectives.", icon: FileEdit, color: "amber", disabled: true },
  { to: "/ppt", title: "PPT Maker", desc: "Create professional presentations in minutes with smart templates.", icon: Presentation, color: "sky", disabled: true },
  { to: "/assessments", title: "Assessment Maker", desc: "Create various types of assessments with answer keys.", icon: ClipboardCheck, color: "rose", moduleKey: "assessment" },
  { to: "/rubric", title: "Rubric Maker", desc: "Design customized rubrics for performance and assessment.", icon: Award, color: "violet", disabled: true },
  { to: "/rewriter", title: "Text Rewriter", desc: "Rewrite and enhance your text to make it clearer and better.", icon: RefreshCw, color: "sky", disabled: true },
  { to: "/translator", title: "Text Translator", desc: "Translate text into different languages instantly.", icon: Languages, color: "emerald", disabled: true },
  { to: "/group", title: "Group Work Generator", desc: "Generate group activities and roles for collaborative learning.", icon: Users2, color: "amber", disabled: true },
  { to: "/ai", title: "AI Assistant", desc: "Get smart help, lesson ideas, content suggestions, and more.", icon: Bot, color: "rose", disabled: true },
];

const COLOR_MAP: Record<string, { bg: string; text: string; btn: string }> = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", btn: "bg-emerald-500 hover:bg-emerald-600" },
  violet: { bg: "bg-violet-100", text: "text-violet-600", btn: "bg-violet-500 hover:bg-violet-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600", btn: "bg-amber-500 hover:bg-amber-600" },
  sky: { bg: "bg-sky-100", text: "text-sky-600", btn: "bg-sky-500 hover:bg-sky-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-600", btn: "bg-rose-500 hover:bg-rose-600" },
};

function Dashboard() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchActivity = useServerFn(listMyActivity);
  const fetchSite = useServerFn(getSiteContent);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: activity } = useQuery({ queryKey: ["my-activity"], queryFn: () => fetchActivity() });
  const { data: site } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });
  const modules = new Set((site?.modules ?? []).filter((m) => m.enabled).map((m) => m.key));

  const first = me?.profile?.first_name || "Teacher";

  return (
    <AppShell title="Dashboard">
      <div className="p-4 md:p-6 space-y-5">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-sky-50 to-white p-6 md:p-10 shadow-sm">
          <div className="max-w-xl relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              Welcome back, {first}! <span>👋</span>
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-navy leading-[1.05]">
              Empowering Teachers.<br />Enriching Education.
            </h1>
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-md">
              Streamline your teaching tasks with intelligent automation. Plan lessons, create assessments, and save more time for what truly matters—your students.
            </p>
          </div>
          {/* Decorative right-side illustration */}
          <div className="pointer-events-none absolute -right-6 top-0 hidden lg:flex items-center justify-end w-[45%] h-full opacity-95">
            <HeroArt />
          </div>
          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        </section>

        {/* Tools grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TOOLS.map((t) => {
            const enabled = !t.disabled && (!t.moduleKey || modules.has(t.moduleKey));
            const c = COLOR_MAP[t.color];
            const Icon = t.icon;
            const card = (
              <div className={"group relative flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition " + (enabled ? "hover:-translate-y-1 hover:shadow-lg cursor-pointer" : "opacity-60")}>
                <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${c.bg} ${c.text}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-[15px] font-bold text-navy leading-tight">{t.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed flex-1">{t.desc}</p>
                <div className={`mt-4 grid h-9 w-9 place-items-center rounded-full text-white shadow ${c.btn} self-end`}>
                  <ArrowRight className="h-4 w-4" />
                </div>
                {t.disabled && (
                  <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">Soon</span>
                )}
              </div>
            );
            return enabled ? <Link key={t.to} to={t.to}>{card}</Link> : <div key={t.to}>{card}</div>;
          })}
        </div>

        {/* Bottom row: activity, quick access, upgrade */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Recent Activity</h2>
              <Link to="/documents" className="text-xs font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-2">
              {(!activity || activity.length === 0) && (
                <p className="text-sm text-muted-foreground">No activity yet. Try opening a tool above.</p>
              )}
              {(activity ?? []).slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.action}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{formatDate(a.created_at)}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Completed</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Quick Access – AI Tools</h2>
              <Link to="/lesson-plans" className="text-xs font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-2">
              <QuickAI title="Lesson Plan Maker" desc="ILAW-formatted plans in seconds." icon={FileText} color="emerald" to="/lesson-plans" />
              <QuickAI title="Automated TOS + Tests" desc="Curriculum-aligned TOS and tests." icon={TableIcon} color="violet" to="/tos" />
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
            <Rocket className="absolute -right-4 -bottom-4 h-40 w-40 text-white/10" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" /> Upgrade to Premium
              </div>
              <h3 className="mt-2 text-lg font-bold leading-tight">Unlock all premium features and AI tools for unlimited access.</h3>
              <button className="mt-4 rounded-lg bg-white/95 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-white">
                Upgrade Now
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex flex-col md:flex-row items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
          <div>© 2026 TALA. All rights reserved.</div>
          <div className="italic">Empowering teachers. Enriching education.</div>
          <div className="flex items-center gap-3">
            <Facebook className="h-4 w-4" />
            <Twitter className="h-4 w-4" />
            <Globe className="h-4 w-4" />
          </div>
        </footer>
      </div>
    </AppShell>
  );
}

function QuickAI({ title, desc, icon: Icon, color, to }: { title: string; desc: string; icon: React.ElementType; color: string; to: string }) {
  const c = COLOR_MAP[color];
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${c.bg} ${c.text}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="truncate text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <Link to={to} className="rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted">Open</Link>
    </div>
  );
}

function HeroArt() {
  return (
    <svg viewBox="0 0 400 300" className="h-56 w-full max-w-[420px]">
      <defs>
        <linearGradient id="lap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4a8a" />
          <stop offset="1" stopColor="#1e2a5e" />
        </linearGradient>
      </defs>
      {/* desk */}
      <rect x="20" y="230" width="360" height="14" rx="4" fill="#e8ecf5" />
      {/* books */}
      <rect x="40" y="180" width="90" height="18" rx="3" fill="#f5b942" />
      <rect x="45" y="162" width="80" height="18" rx="3" fill="#e57373" />
      <rect x="50" y="144" width="70" height="18" rx="3" fill="#64b5f6" />
      {/* cup */}
      <rect x="140" y="180" width="26" height="30" rx="4" fill="#5a6fbf" />
      <rect x="145" y="170" width="4" height="14" fill="#333" />
      <rect x="152" y="168" width="4" height="16" fill="#333" />
      <rect x="159" y="170" width="4" height="14" fill="#333" />
      {/* laptop */}
      <rect x="180" y="120" width="150" height="100" rx="8" fill="url(#lap)" />
      <rect x="188" y="128" width="134" height="82" rx="4" fill="#2b3a75" />
      <text x="255" y="175" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="900" fontFamily="Inter">TALA</text>
      <rect x="170" y="218" width="170" height="8" rx="3" fill="#2b3a75" />
      {/* mug */}
      <ellipse cx="340" cy="210" rx="16" ry="4" fill="#d7dcea" />
      <rect x="326" y="188" width="28" height="24" rx="4" fill="#fff" stroke="#c8cddb" />
      {/* plant */}
      <rect x="360" y="200" width="24" height="26" rx="4" fill="#f0e6d4" />
      <path d="M372 200 Q360 170 350 180 Q365 175 372 200" fill="#4caf50" />
      <path d="M372 200 Q384 168 396 180 Q380 175 372 200" fill="#66bb6a" />
      <path d="M372 200 Q372 160 370 148 Q378 160 372 200" fill="#43a047" />
    </svg>
  );
}
