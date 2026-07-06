import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { adminStats, listActivityLogs } from "@/lib/admin.functions";
import { Users, UserCheck, FileText, Table, ClipboardCheck, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — TALA" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const st = useServerFn(adminStats);
  const lg = useServerFn(listActivityLogs);
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => st() });
  const { data: logs } = useQuery({ queryKey: ["admin-logs"], queryFn: () => lg() });

  const tiles = [
    { label: "Users", value: stats?.users ?? 0, icon: Users, color: "primary" },
    { label: "Pending Requests", value: stats?.pending ?? 0, icon: UserCheck, color: "warning" },
    { label: "Lesson Plans", value: stats?.lesson_plans ?? 0, icon: FileText, color: "primary" },
    { label: "TOS Generated", value: stats?.tos ?? 0, icon: Table, color: "success" },
    { label: "Assessments", value: stats?.assessments ?? 0, icon: ClipboardCheck, color: "warning" },
  ];

  return (
    <AdminShell title="Admin Dashboard">
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the TALA platform</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => {
            const Icon = t.icon;
            const bg = t.color === "success" ? "bg-success/15 text-success" : t.color === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-primary/15 text-primary";
            return (
              <div key={t.label} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${bg}`}><Icon className="h-5 w-5" /></div>
                <div className="text-3xl font-extrabold tabular-nums">{t.value}</div>
                <div className="text-xs text-muted-foreground">{t.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link to="/admin/approvals" className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition">
            <div>
              <div className="text-lg font-bold">Review pending accounts</div>
              <div className="text-sm text-muted-foreground">{stats?.pending ?? 0} teachers awaiting approval</div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </Link>
          <Link to="/admin/content" className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition">
            <div>
              <div className="text-lg font-bold">Edit website content</div>
              <div className="text-sm text-muted-foreground">Update hero, mission, vision, and more</div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </Link>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
          <div className="space-y-2">
            {(logs ?? []).slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
                <div>
                  <div className="font-medium">{l.action}</div>
                  <div className="text-xs text-muted-foreground">{l.details}</div>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(l.created_at)}</div>
              </div>
            ))}
            {(!logs || logs.length === 0) && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
