import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { listActivityLogs } from "@/lib/admin.functions";
import { formatDate } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Activity Logs — TALA Admin" }, { name: "robots", content: "noindex" }] }),
  component: LogsPage,
});

function LogsPage() {
  const fn = useServerFn(listActivityLogs);
  const { data } = useQuery({ queryKey: ["admin-logs"], queryFn: () => fn() });

  return (
    <AdminShell title="Activity Logs">
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-extrabold">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Recent platform activity across all users.</p>
        <div className="mt-6 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="space-y-1">
            {(data ?? []).map((l) => (
              <div key={l.id} className="grid grid-cols-[110px_1fr] items-start gap-4 border-b py-2.5 text-sm last:border-b-0">
                <div className="text-xs text-muted-foreground">{formatDate(l.created_at)}</div>
                <div>
                  <div className="font-medium">{l.action}</div>
                  {l.details && <div className="text-xs text-muted-foreground">{l.details}</div>}
                </div>
              </div>
            ))}
            {(!data || data.length === 0) && <p className="p-6 text-center text-muted-foreground">No logs yet.</p>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
