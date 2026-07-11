import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { getMyProfile } from "@/lib/user.functions";
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
  ExternalLink,
  Sparkles,
  Megaphone,
  Quote,
  Layers,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TALA" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Tool = {
  to: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  moduleKey?: string;
  disabled?: boolean;
};

const TOOLS: Tool[] = [
  { to: "/lesson-plans", title: "Lesson Plan Maker", desc: "Create ILAW-formatted lesson plans quickly and effortlessly.", icon: FileText, color: "emerald", moduleKey: "lesson_plan" },
  { to: "/tos", title: "Automated TOS with Test Generator", desc: "Generate curriculum-aligned TOS and automatically create tests.", icon: TableIcon, color: "violet", moduleKey: "tos" },
  { to: "/worksheet", title: "Worksheet Maker", desc: "Generate engaging worksheets tailored to your learning objectives.", icon: FileEdit, color: "amber" },
  { to: "/ppt", title: "PPT Maker", desc: "Create professional presentations in minutes with smart templates.", icon: Presentation, color: "sky" },
  { to: "/assessments", title: "Assessment Maker", desc: "Create various types of assessments with answer keys.", icon: ClipboardCheck, color: "rose", moduleKey: "assessment" },
  { to: "/rubric", title: "Rubric Maker", desc: "Design customized rubrics for performance and assessment.", icon: Award, color: "violet" },
  { to: "/rewriter", title: "Text Rewriter", desc: "Rewrite and enhance your text to make it clearer and better.", icon: RefreshCw, color: "sky" },
  { to: "/translator", title: "Text Translator", desc: "Translate text into different languages instantly.", icon: Languages, color: "emerald" },
  { to: "/las", title: "Learning Activity Sheet (LAS) Maker", desc: "Design ready-to-print LAS aligned to MELCs and MATATAG.", icon: Layers, color: "amber" },
  { to: "/performance-task", title: "Performance Task Maker", desc: "Build authentic performance tasks with clear GRASPS structure.", icon: Trophy, color: "rose" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; btn: string; ring: string }> = {
  emerald: { bg: "bg-gradient-to-br from-emerald-100 to-emerald-200", text: "text-emerald-600", btn: "bg-gradient-to-br from-emerald-500 to-emerald-600", ring: "shadow-emerald-200/60" },
  violet: { bg: "bg-gradient-to-br from-violet-100 to-violet-200", text: "text-violet-600", btn: "bg-gradient-to-br from-violet-500 to-violet-600", ring: "shadow-violet-200/60" },
  amber: { bg: "bg-gradient-to-br from-amber-100 to-amber-200", text: "text-amber-600", btn: "bg-gradient-to-br from-amber-500 to-amber-600", ring: "shadow-amber-200/60" },
  sky: { bg: "bg-gradient-to-br from-sky-100 to-sky-200", text: "text-sky-600", btn: "bg-gradient-to-br from-sky-500 to-sky-600", ring: "shadow-sky-200/60" },
  rose: { bg: "bg-gradient-to-br from-rose-100 to-rose-200", text: "text-rose-600", btn: "bg-gradient-to-br from-rose-500 to-rose-600", ring: "shadow-rose-200/60" },
};

const QUICK_LINKS = [
  {
    title: "ChatGPT",
    desc: "OpenAI conversational assistant.",
    href: "https://chatgpt.com/",
    color: "emerald",
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M22.28 9.82a5.7 5.7 0 0 0-.49-4.68 5.75 5.75 0 0 0-6.2-2.75A5.72 5.72 0 0 0 4.55 4.5a5.75 5.75 0 0 0-3.85 2.79A5.75 5.75 0 0 0 1.4 14.2a5.7 5.7 0 0 0 .5 4.68 5.75 5.75 0 0 0 6.19 2.75 5.7 5.7 0 0 0 4.3 1.92 5.75 5.75 0 0 0 5.48-3.98 5.75 5.75 0 0 0 3.84-2.79 5.75 5.75 0 0 0-.71-6.94ZM13.44 20.9a4.26 4.26 0 0 1-2.74-.99l.13-.08 4.55-2.63a.75.75 0 0 0 .38-.65V10.1l1.92 1.11a.07.07 0 0 1 .04.05v5.32a4.28 4.28 0 0 1-4.28 4.32Z" />
      </svg>
    ),
  },
  {
    title: "Google Gemini",
    desc: "Google's multimodal AI assistant.",
    href: "https://gemini.google.com/app",
    color: "sky",
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2c.7 5.1 4.9 9.3 10 10-5.1.7-9.3 4.9-10 10-.7-5.1-4.9-9.3-10-10 5.1-.7 9.3-4.9 10-10Z" />
      </svg>
    ),
  },
  {
    title: "DepEd BOW",
    desc: "Three-Term Budget of Work — DepEd LR Portal.",
    href: "https://sites.google.com/deped.gov.ph/deped-lrportal/three-term-budget-of-work-bow",
    color: "amber",
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2L2 7l10 5 10-5-10-5Zm-8 8v6l8 4 8-4v-6l-8 4-8-4Z" />
      </svg>
    ),
  },
];

const QUOTES: { text: string; author: string }[] = [
  { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
  { text: "A teacher affects eternity; he can never tell where his influence stops.", author: "Henry Adams" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "The best teachers teach from the heart, not from the book.", author: "Unknown" },
  { text: "Educating the mind without educating the heart is no education at all.", author: "Aristotle" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "Great teachers empathize with kids, respect them, and believe that each one has something special.", author: "Ann Lieberman" },
  { text: "The influence of a good teacher can never be erased.", author: "Unknown" },
  { text: "Teachers plant seeds of knowledge that grow forever.", author: "Unknown" },
  { text: "To teach is to touch a life forever.", author: "Unknown" },
  { text: "The great teacher inspires.", author: "William Arthur Ward" },
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { text: "Every child deserves a champion — an adult who will never give up on them.", author: "Rita Pierson" },
];

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function Dashboard() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchSite = useServerFn(getSiteContent);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: site } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });
  const modules = new Set((site?.modules ?? []).filter((m) => m.enabled).map((m) => m.key));

  const first = me?.profile?.first_name || "Teacher";
  const [today] = useState(() => new Date());
  const quote = QUOTES[dayOfYear(today) % QUOTES.length];
  const updates = (site?.announcements ?? []).slice(0, 5);

  return (
    <AppShell title="Dashboard">
      <div className="relative space-y-6 p-4 md:p-6">
        {/* subtle background glows for depth */}
        <div aria-hidden className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-40 -left-20 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-indigo-100 via-sky-50 to-white p-6 shadow-[0_30px_60px_-30px_rgba(30,42,94,0.35)] md:p-10">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">
              Welcome back, {first}! <span>👋</span>
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight text-navy drop-shadow-sm md:text-5xl">
              Empowering Teachers.
              <br />
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-sky-500 bg-clip-text text-transparent">Enriching Education.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground md:text-base">
              Streamline your teaching tasks with intelligent automation. Plan lessons, create assessments, and save more time for what truly matters — your students.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-6 top-0 hidden h-full w-[45%] items-center justify-end opacity-95 lg:flex">
            <HeroArt />
          </div>
          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        </section>

        {/* Tools grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLS.map((t) => {
            const enabled = !t.disabled && (!t.moduleKey || modules.has(t.moduleKey));
            const c = COLOR_MAP[t.color];
            const Icon = t.icon;
            const card = (
              <div className={"group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.25)] transition-all " + (enabled ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.35)]" : "opacity-60")}>
                <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${c.bg} ${c.text} shadow-lg ${c.ring} ring-1 ring-white/70`}>
                  <Icon className="h-7 w-7 drop-shadow-sm" />
                </div>
                <h3 className="text-[15px] font-bold leading-tight text-navy">{t.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
                <div className={`mt-4 grid h-9 w-9 place-items-center self-end rounded-full text-white shadow-lg ${c.btn} ${c.ring} ring-1 ring-white/40 transition group-hover:scale-110`}>
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/50 opacity-0 blur-2xl transition group-hover:opacity-100" />
              </div>
            );
            return enabled ? <Link key={t.to} to={t.to}>{card}</Link> : <div key={t.to}>{card}</div>;
          })}
        </div>

        {/* Updates + Quote + Quick Access */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* TALA New Updates */}
          <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.3)]">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 text-white shadow-lg ring-1 ring-white/50">
                <Sparkles className="h-4 w-4 drop-shadow" />
              </div>
              <div>
                <div className="text-sm font-black text-navy">TALA New Updates</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">What's new</div>
              </div>
            </div>
            {updates.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                <Megaphone className="mx-auto mb-1 h-5 w-5" />
                No updates yet — new announcements from the admin will appear here.
              </div>
            ) : (
              <ul className="space-y-2">
                {updates.map((a: any) => (
                  <li key={a.id} className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 shadow" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-navy">{a.title}</div>
                        {a.body && <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{a.body}</div>}
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />
          </div>

          {/* Quick Access */}
          <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.3)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-navy">Quick Access</h2>
            </div>
            <div className="space-y-2">
              {QUICK_LINKS.map((q) => {
                const c = COLOR_MAP[q.color];
                return (
                  <a key={q.title} href={q.href} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.bg} ${c.text} shadow-lg ring-1 ring-white/60`}>{q.logo}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        {q.title} <ExternalLink className="h-3 w-3 opacity-40" />
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">{q.desc}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Daily Quote */}
          <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 p-5 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.3)]">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-rose-500 shadow-lg ring-1 ring-white/60">
                <Quote className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-black text-navy">Daily Inspiring Quote</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">For today's teacher</div>
              </div>
            </div>
            <blockquote className="mt-4 text-sm italic leading-relaxed text-navy/90">
              “{quote.text}”
            </blockquote>
            <div className="mt-3 text-right text-xs font-semibold text-muted-foreground">— {quote.author}</div>
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-rose-300/30 blur-2xl" />
            <div className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full bg-violet-300/30 blur-2xl" />
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground md:flex-row">
          <div>© 2026 TALA. All rights reserved.</div>
          <div className="italic">Empowering teachers. Enriching education.</div>
        </footer>
      </div>
    </AppShell>
  );
}

function HeroArt() {
  return (
    <svg viewBox="0 0 400 300" className="h-56 w-full max-w-[420px] drop-shadow-xl">
      <defs>
        <linearGradient id="lap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4a8a" />
          <stop offset="1" stopColor="#1e2a5e" />
        </linearGradient>
      </defs>
      <rect x="20" y="230" width="360" height="14" rx="4" fill="#e8ecf5" />
      <rect x="40" y="180" width="90" height="18" rx="3" fill="#f5b942" />
      <rect x="45" y="162" width="80" height="18" rx="3" fill="#e57373" />
      <rect x="50" y="144" width="70" height="18" rx="3" fill="#64b5f6" />
      <rect x="140" y="180" width="26" height="30" rx="4" fill="#5a6fbf" />
      <rect x="180" y="120" width="150" height="100" rx="8" fill="url(#lap)" />
      <rect x="188" y="128" width="134" height="82" rx="4" fill="#2b3a75" />
      <text x="255" y="175" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="900" fontFamily="Inter">
        TALA
      </text>
      <rect x="170" y="218" width="170" height="8" rx="3" fill="#2b3a75" />
      <ellipse cx="340" cy="210" rx="16" ry="4" fill="#d7dcea" />
      <rect x="326" y="188" width="28" height="24" rx="4" fill="#fff" stroke="#c8cddb" />
      <rect x="360" y="200" width="24" height="26" rx="4" fill="#f0e6d4" />
      <path d="M372 200 Q360 170 350 180 Q365 175 372 200" fill="#4caf50" />
      <path d="M372 200 Q384 168 396 180 Q380 175 372 200" fill="#66bb6a" />
    </svg>
  );
}

useEffect;
