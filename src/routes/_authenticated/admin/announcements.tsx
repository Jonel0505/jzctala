import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { getSiteContent } from "@/lib/public.functions";
import { upsertAnnouncement, deleteAnnouncement } from "@/lib/admin.functions";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({ meta: [{ title: "Announcements — TALA Admin" }, { name: "robots", content: "noindex" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const fetchSite = useServerFn(getSiteContent);
  const upsert = useServerFn(upsertAnnouncement);
  const rm = useServerFn(deleteAnnouncement);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });
  const [form, setForm] = useState({ title: "", body: "" });

  const inv = () => { qc.invalidateQueries({ queryKey: ["site"] }); qc.invalidateQueries({ queryKey: ["site-public"] }); };
  const create = useMutation({
    mutationFn: () => upsert({ data: { ...form, published: true } }),
    onSuccess: () => { setForm({ title: "", body: "" }); inv(); toast.success("Posted."); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => rm({ data: { id } }),
    onSuccess: () => { inv(); toast.success("Removed."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell title="Announcements">
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-extrabold">Announcements</h1>

        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="mt-6 space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <textarea required rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Message" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <button disabled={create.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Publish
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {(data?.announcements ?? []).map((a) => (
            <div key={a.id} className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-sm">
              <div>
                <div className="text-lg font-bold">{a.title}</div>
                <div className="text-sm text-muted-foreground">{a.body}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDate(a.created_at)}</div>
              </div>
              <button onClick={() => del.mutate(a.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
