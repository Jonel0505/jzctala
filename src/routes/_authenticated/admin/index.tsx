import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { adminStats, listActivityLogs, listPendingUsers, setUserStatus } from "@/lib/admin.functions";
import {
  Users,
  Clock,
  FileText,
  Table as TableIcon,
  ClipboardCheck,
  UserPlus,
  Megaphone,
  UploadCloud,
  Database,
  Settings as SettingsIcon,
  Puzzle,
  Mail,
  ScrollText,
  Check,
  X,
  Calendar,
  ArrowUp,
  Facebook,
  Twitter,
  Globe,
} from "lucide-react";
import { formatDate } from "@/lib/tala-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AvatarImg } from "@/components/tala/AvatarImg";
import { initials } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — TALA" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const st = useServerFn(adminStats);
  const lg = useServerFn(listActivityLogs);
  const pd = useServerFn(listPendingUsers);
  const setStatus = useServerFn(setUserStatus);
  const qc = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => st() });
  const { data: logs } = useQuery({ queryKey: ["admin-logs"], queryFn: () => lg() });
  const { data: pending } = useQuery({ queryKey: ["admin-pending"], queryFn: () => pd() });

  const mut = useMutation({
    mutationFn: (v: { user_id: string; status: "approved" | "denied" }) => setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tiles = [
    { label: "Total Users", value: stats?.users ?? 0, icon: Users, color: "sky", sub: "12% from last month", trend: "up" as const },
    { label: "Pending Approvals", value: stats?.pending ?? 0, icon: Clock, color: "amber", sub: "Requires your action", trend: "warn" as const },
    { label: "Lesson Plans", value: stats?.lesson_plans ?? 0, icon: FileText, color: "emerald", sub: "18% this month", trend: "up" as const },
    { label: "TOS Generated", value: stats?.tos ?? 0, icon: TableIcon, color: "violet", sub: "8% this month", trend: "up" as const },
    { label: "Assessments", value: stats?.assessments ?? 0, icon: ClipboardCheck, color: "sky", sub: "15% this month", trend: "up" as const },
  ];

  const tools = [
    { label: "Add User", icon: UserPlus, color: "sky", to: "/admin/users" },
    { label: "Add Announcement", icon: Megaphone, color: "amber", to: "/admin/announcements" },
    { label: "Upload Resource", icon: UploadCloud, color: "emerald", to: "/admin/content" },
    { label: "Create Backup", icon: Database, color: "violet", to: "/admin" },
    { label: "System Settings", icon: SettingsIcon, color: "sky", to: "/admin/modules" },
    { label: "Manage Modules", icon: Puzzle, color: "rose", to: "/admin/modules" },
    { label: "Email Users", icon: Mail, color: "amber", to: "/admin/announcements" },
    { label: "View Logs", icon: ScrollText, color: "sky", to: "/admin/logs" },
  ];

  const colorClass: Record<string, { bg: string; text: string }> = {
    sky: { bg: "bg-sky-100", text: "text-sky-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    violet: { bg: "bg-violet-100", text: "text-violet-600" },
    rose: { bg: "bg-rose-100", text: "text-rose-600" },
  };

  const today = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <AdminShell title="Admin Dashboard">
      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy">
              Welcome back, Admin! <span className="inline-block">👋</span>
            </h1>
            <p className="text-sm text-muted-foreground">Here's what's happening on TALA today.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold shadow-sm">
            <Calendar className="h-4 w-4 text-primary" /> {today}
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => {
            const c = colorClass[t.color];
            const Icon = t.icon;
            return (
              <div key={t.label} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.bg} ${c.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black tabular-nums leading-none">{t.value}</div>
                    <div className="text-[11px] font-semibold text-muted-foreground mt-1">{t.label}</div>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-1 text-[11px] font-semibold ${t.trend === "warn" ? "text-amber-600" : "text-emerald-600"}`}>
                  {t.trend === "up" && <ArrowUp className="h-3 w-3" />}
                  <span>{t.sub}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row: Platform Overview + Quick Tools */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Platform Overview</h2>
              <select className="rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
              <ChartLine />
              <div className="space-y-3">
                <MiniStat label="Active Users" value={stats?.users ?? 0} pct="15%" icon={Users} color="sky" />
                <MiniStat label="Documents Created" value={(stats?.lesson_plans ?? 0) + (stats?.tos ?? 0) + (stats?.assessments ?? 0)} pct="20%" icon={FileText} color="violet" />
                <MiniStat label="Downloads" value={0} pct="10%" icon={UploadCloud} color="emerald" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold">Quick Tools</h2>
            <div className="grid grid-cols-4 gap-2">
              {tools.map((t) => {
                const c = colorClass[t.color];
                const Icon = t.icon;
                return (
                  <Link
                    key={t.label}
                    to={t.to}
                    className="flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center hover:bg-muted transition"
                  >
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${c.bg} ${c.text}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-[10px] font-semibold leading-tight text-navy">{t.label}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Row: Pending Approvals + Recent Activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">
                Pending User Approvals{" "}
                {(stats?.pending ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">{stats?.pending}</span>
                )}
              </h2>
              <Link to="/admin/approvals" className="text-xs font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase text-muted-foreground border-b">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">School</th>
                    <th className="pb-2">Registered</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(pending ?? []).slice(0, 5).map((u) => (
                    <tr key={u.id} className="border-b last:border-b-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <AvatarImg path={u.avatar_url ?? null} fallback={initials(u.first_name, u.last_name)} className="h-8 w-8 rounded-full" />
                          <span className="font-medium">{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-xs">{u.email}</td>
                      <td className="py-2.5 text-xs">{u.school || "—"}</td>
                      <td className="py-2.5 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => mut.mutate({ user_id: u.id, status: "approved" })}
                            className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => mut.mutate({ user_id: u.id, status: "denied" })}
                            className="grid h-7 w-7 place-items-center rounded-md bg-rose-500 text-white hover:bg-rose-600"
                            title="Deny"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!pending || pending.length === 0) && (
                    <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No pending approvals.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Recent Activity</h2>
              <Link to="/admin/logs" className="text-xs font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-2">
              {(logs ?? []).slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-start gap-3 border-b pb-2 last:border-b-0">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-600">
                    <ScrollText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{l.action}</div>
                    {l.details && <div className="text-[11px] text-muted-foreground truncate">{l.details}</div>}
                  </div>
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(l.created_at)}</div>
                </div>
              ))}
              {(!logs || logs.length === 0) && (
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              )}
            </div>
          </section>
        </div>

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
    </AdminShell>
  );
}

function MiniStat({ label, value, pct, icon: Icon, color }: { label: string; value: number; pct: string; icon: React.ElementType; color: string }) {
  const map: Record<string, string> = {
    sky: "bg-sky-100 text-sky-600",
    violet: "bg-violet-100 text-violet-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${map[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <div className="text-lg font-black tabular-nums">{value}</div>
          <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5"><ArrowUp className="h-2.5 w-2.5" />{pct}</div>
        </div>
      </div>
    </div>
  );
}

function ChartLine() {
  // Simple SVG sparkline area chart
  const pts = [15, 22, 28, 40, 35, 48, 55, 50, 62, 70, 68, 75];
  const w = 320, h = 180, pad = 24;
  const max = Math.max(...pts);
  const step = (w - pad * 2) / (pts.length - 1);
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(" ");
  const area = `${path} L${pad + (pts.length - 1) * step},${h - pad} L${pad},${h - pad} Z`;
  return (
    <div className="min-h-[180px]">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(59,130,246)" stopOpacity="0.35" />
            <stop offset="1" stopColor="rgb(59,130,246)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line key={i} x1={pad} x2={w - pad} y1={pad + r * (h - pad * 2)} y2={pad + r * (h - pad * 2)} stroke="#eef1f7" />
        ))}
        <path d={area} fill="url(#chartFill)" />
        <path d={path} fill="none" stroke="rgb(59,130,246)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((v, i) => (
          <circle key={i} cx={pad + i * step} cy={h - pad - (v / max) * (h - pad * 2)} r="3" fill="#fff" stroke="rgb(59,130,246)" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}
