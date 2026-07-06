import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { listPendingUsers, setUserStatus } from "@/lib/admin.functions";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  head: () => ({ meta: [{ title: "User Approvals — TALA Admin" }, { name: "robots", content: "noindex" }] }),
  component: Approvals,
});

function Approvals() {
  const fn = useServerFn(listPendingUsers);
  const set = useServerFn(setUserStatus);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["pending-users"], queryFn: () => fn() });
  const [denyId, setDenyId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const mut = useMutation({
    mutationFn: (v: { user_id: string; status: "approved" | "denied"; reason?: string }) => set({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setDenyId(null); setReason("");
      toast.success("Status updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell title="User Approval">
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-extrabold">Pending Registrations</h1>
        <p className="text-sm text-muted-foreground">Approve or deny new teacher accounts.</p>

        <div className="mt-6 space-y-3">
          {(data ?? []).length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">No pending accounts.</div>
          )}
          {(data ?? []).map((u) => (
            <div key={u.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold">{u.first_name} {u.middle_name} {u.last_name}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[u.position, u.school, u.division, u.region].filter(Boolean).join(" · ")}
                    {u.employee_id && ` · ID: ${u.employee_id}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => mut.mutate({ user_id: u.id, status: "approved" })} className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground hover:opacity-90">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => setDenyId(u.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90">
                    <X className="h-4 w-4" /> Deny
                  </button>
                </div>
              </div>
              {denyId === u.id && (
                <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">Reason (optional)</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded border bg-card p-2 text-sm" />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setDenyId(null)} className="rounded border px-3 py-1.5 text-sm">Cancel</button>
                    <button onClick={() => mut.mutate({ user_id: u.id, status: "denied", reason })} className="rounded bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground">Confirm Deny</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
