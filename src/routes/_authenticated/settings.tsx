import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { getMyProfile, updateMyProfile } from "@/lib/user.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TALA" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const fn = useServerFn(getMyProfile);
  const upd = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => fn() });
  const [form, setForm] = useState({ first_name: "", middle_name: "", last_name: "", school: "", division: "", region: "", position: "", employee_id: "" });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        first_name: data.profile.first_name ?? "",
        middle_name: data.profile.middle_name ?? "",
        last_name: data.profile.last_name ?? "",
        school: data.profile.school ?? "",
        division: data.profile.division ?? "",
        region: data.profile.region ?? "",
        position: data.profile.position ?? "",
        employee_id: data.profile.employee_id ?? "",
      });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () => upd({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); toast.success("Profile updated."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Account Settings">
      <div className="p-6 md:p-8">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="mx-auto max-w-2xl space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold">Profile</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <F label="First Name"><input required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></F>
            <F label="Middle Name"><input className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></F>
            <F label="Last Name"><input required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></F>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Employee ID"><input className="input" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} /></F>
            <F label="Position"><input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></F>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <F label="School"><input className="input" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /></F>
            <F label="Division"><input className="input" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} /></F>
            <F label="Region"><input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></F>
          </div>
          <button disabled={mut.isPending} className="btn-primary flex items-center justify-center gap-2">
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </form>
      </div>
      <style>{`
        .input { display:block; width:100%; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-card); padding:0.55rem 0.75rem; font-size:0.9rem; }
        .btn-primary { display:block; width:100%; border-radius:0.5rem; background:var(--color-primary); color:var(--color-primary-foreground); padding:0.7rem 1rem; font-weight:600; font-size:0.9rem; }
        .btn-primary:disabled { opacity:0.6; }
      `}</style>
    </AppShell>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>{children}</label>;
}
