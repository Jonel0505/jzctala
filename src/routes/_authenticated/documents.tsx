import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { listMyDocuments, deleteDocument } from "@/lib/user.functions";
import { FileText, Table, ClipboardCheck, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/tala-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "My Documents — TALA" }, { name: "robots", content: "noindex" }] }),
  component: DocsPage,
});

function DocsPage() {
  const fn = useServerFn(listMyDocuments);
  const del = useServerFn(deleteDocument);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-docs"], queryFn: () => fn() });
  const rm = useMutation({
    mutationFn: (v: { kind: "lesson_plans" | "tos" | "assessments"; id: string }) => del({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-docs"] }); toast.success("Deleted."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="My Documents">
      <div className="space-y-6 p-6 md:p-8">
        <Group title="Lesson Plans" icon={FileText} accent="primary">
          {(data?.lesson_plans ?? []).length === 0 && <Empty label="lesson plans" />}
          {(data?.lesson_plans ?? []).map((d) => (
            <Row key={d.id} title={d.title} sub={`${d.subject ?? ""} · ${d.grade ?? ""} · ${formatDate(d.created_at)}`} onDelete={() => rm.mutate({ kind: "lesson_plans", id: d.id })} />
          ))}
        </Group>
        <Group title="Tables of Specification" icon={Table} accent="success">
          {(data?.tos ?? []).length === 0 && <Empty label="TOS" />}
          {(data?.tos ?? []).map((d) => (
            <Row key={d.id} title={d.title} sub={`${d.subject ?? ""} · ${d.grade ?? ""} · ${formatDate(d.created_at)}`} onDelete={() => rm.mutate({ kind: "tos", id: d.id })} />
          ))}
        </Group>
        <Group title="Assessments" icon={ClipboardCheck} accent="warning">
          {(data?.assessments ?? []).length === 0 && <Empty label="assessments" />}
          {(data?.assessments ?? []).map((d) => (
            <Row key={d.id} title={d.title} sub={`${d.subject ?? ""} · ${d.grade ?? ""} · ${formatDate(d.created_at)}`} onDelete={() => rm.mutate({ kind: "assessments", id: d.id })} />
          ))}
        </Group>
      </div>
    </AppShell>
  );
}

function Group({ title, icon: Icon, accent, children }: any) {
  const bg = accent === "success" ? "bg-success/15 text-success" : accent === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-primary/15 text-primary";
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${bg}`}><Icon className="h-5 w-5" /></div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Row({ title, sub, onDelete }: { title: string; sub: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <button onClick={onDelete} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">No {label} yet.</p>;
}
