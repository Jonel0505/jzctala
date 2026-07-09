import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/tala/AdminShell";
import { listAllUsers, setUserStatus, deleteUser, promoteAdmin, removeUserDevice } from "@/lib/admin.functions";
import { Search, ShieldCheck, Ban, Trash2, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "User Management — TALA Admin" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

function UsersPage() {
  const list = useServerFn(listAllUsers);
  const setSt = useServerFn(setUserStatus);
  const del = useServerFn(deleteUser);
  const promote = useServerFn(promoteAdmin);
  const rmDevice = useServerFn(removeUserDevice);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data } = useQuery({ queryKey: ["all-users"], queryFn: () => list() });
  const filtered = (data ?? []).filter((u) => {
    const s = `${u.first_name} ${u.last_name} ${u.email} ${u.school}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["all-users"] });
  const setMut = useMutation({ mutationFn: (v: any) => setSt({ data: v }), onSuccess: () => { inv(); toast.success("Updated."); }, onError: (e: Error) => toast.error(e.message) });
  const delMut = useMutation({ mutationFn: (id: string) => del({ data: { user_id: id } }), onSuccess: () => { inv(); toast.success("Deleted."); }, onError: (e: Error) => toast.error(e.message) });
  const promMut = useMutation({ mutationFn: (id: string) => promote({ data: { user_id: id } }), onSuccess: () => toast.success("Promoted to admin."), onError: (e: Error) => toast.error(e.message) });
  const rmDevMut = useMutation({ mutationFn: (rowId: string) => rmDevice({ data: { device_row_id: rowId } }), onSuccess: () => { inv(); toast.success("Device removed."); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <AdminShell title="User Management">
      <div className="p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold">All Users</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="rounded-lg border bg-card pl-9 pr-4 py-2 text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">School</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Devices (1st / 2nd)</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.school}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-xs">
                    {(u.devices ?? []).length === 0 && <span className="text-muted-foreground">No devices yet</span>}
                    <ul className="space-y-1">
                      {(u.devices ?? []).slice(0, 2).map((d: any, i: number) => (
                        <li key={d.id} className="flex items-start gap-2">
                          <span className="mt-0.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">#{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-mono text-[10px] text-muted-foreground" title={d.device_id}>{d.device_id.slice(0, 12)}…</div>
                            <div className="truncate" title={d.user_agent ?? ""}>{shortUA(d.user_agent)}</div>
                            <div className="text-[10px] text-muted-foreground">First: {new Date(d.first_seen).toLocaleString()}</div>
                            <div className="text-[10px] text-muted-foreground">Last: {new Date(d.last_seen).toLocaleString()}</div>
                          </div>
                          <button title="Remove device" onClick={() => { if (confirm("Remove this device? User will be able to log in from a new device.")) rmDevMut.mutate(d.id); }} className="text-destructive hover:underline text-[10px]">Remove</button>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3"><StatusBadge s={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {u.status === "pending" && (
                        <IconBtn title="Approve" onClick={() => setMut.mutate({ user_id: u.id, status: "approved" })}><Check className="h-4 w-4" /></IconBtn>
                      )}
                      {u.status === "denied" && (
                        <IconBtn title="Restore to pending" onClick={() => setMut.mutate({ user_id: u.id, status: "pending" })}><RotateCcw className="h-4 w-4" /></IconBtn>
                      )}
                      {u.status === "approved" && (
                        <IconBtn title="Disable" onClick={() => setMut.mutate({ user_id: u.id, status: "disabled" })}><Ban className="h-4 w-4" /></IconBtn>
                      )}
                      {u.status === "disabled" && (
                        <IconBtn title="Re-enable" onClick={() => setMut.mutate({ user_id: u.id, status: "approved" })}><Check className="h-4 w-4" /></IconBtn>
                      )}
                      <IconBtn title="Make admin" onClick={() => promMut.mutate(u.id)}><ShieldCheck className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Delete" danger onClick={() => { if (confirm("Delete this user permanently?")) delMut.mutate(u.id); }}><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/15 text-success",
    pending: "bg-warning/20 text-warning-foreground",
    denied: "bg-destructive/15 text-destructive",
    disabled: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${map[s] ?? "bg-muted"}`}>{s}</span>;
}
function IconBtn({ children, onClick, title, danger }: any) {
  return (
    <button title={title} onClick={onClick} className={`rounded-md border p-1.5 hover:bg-muted ${danger ? "text-destructive hover:bg-destructive/10" : ""}`}>{children}</button>
  );
}
