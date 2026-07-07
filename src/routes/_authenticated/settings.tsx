import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/tala/AppShell";
import { AvatarImg } from "@/components/tala/AvatarImg";
import { getMyProfile, updateMyProfile, setMyAvatar, changeMyPassword } from "@/lib/user.functions";
import { toast } from "sonner";
import { Loader2, Camera, KeyRound, User as UserIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { initials } from "@/lib/tala-utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TALA" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const fn = useServerFn(getMyProfile);
  const upd = useServerFn(updateMyProfile);
  const setAvatar = useServerFn(setMyAvatar);
  const changePw = useServerFn(changeMyPassword);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => fn() });
  const [form, setForm] = useState({ first_name: "", middle_name: "", last_name: "", school: "", division: "", region: "", position: "", employee_id: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });

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

  const pwMut = useMutation({
    mutationFn: () => changePw({ data: { current_password: pw.current_password, new_password: pw.new_password } }),
    onSuccess: () => { toast.success("Password changed."); setPw({ current_password: "", new_password: "", confirm: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAvatar = async (file: File) => {
    if (!data?.profile) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB.");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${data.profile.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      // Remove old if any
      if (data.profile.avatar_url && data.profile.avatar_url !== path) {
        await supabase.storage.from("avatars").remove([data.profile.avatar_url]);
      }
      await setAvatar({ data: { avatar_url: path } });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile photo updated.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!data?.profile?.avatar_url) return;
    setUploading(true);
    try {
      await supabase.storage.from("avatars").remove([data.profile.avatar_url]);
      await setAvatar({ data: { avatar_url: null } });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Photo removed.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const submitPw = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new_password.length < 8) return toast.error("New password must be at least 8 characters.");
    if (pw.new_password !== pw.confirm) return toast.error("Passwords do not match.");
    pwMut.mutate();
  };

  return (
    <AppShell title="Account Settings">
      <div className="p-4 md:p-8 space-y-5 max-w-4xl mx-auto">
        {/* Photo */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Camera className="h-5 w-5 text-primary" /> Profile Photo</h2>
          <div className="flex items-center gap-5">
            <AvatarImg
              path={data?.profile?.avatar_url ?? null}
              fallback={initials(data?.profile?.first_name, data?.profile?.last_name)}
              className="h-24 w-24 rounded-full ring-4 ring-primary/10"
            />
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatar(f); e.target.value = ""; }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Upload new photo
              </button>
              {data?.profile?.avatar_url && (
                <button
                  onClick={removeAvatar}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              )}
              <p className="text-xs text-muted-foreground">JPG or PNG, up to 5MB.</p>
            </div>
          </div>
        </section>

        {/* Profile */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold"><UserIcon className="h-5 w-5 text-primary" /> Profile Information</h2>
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
        </section>

        {/* Change Password */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={submitPw} className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound className="h-5 w-5 text-primary" /> Change Password</h2>
            <F label="Current Password">
              <input required type="password" className="input" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
            </F>
            <div className="grid gap-3 md:grid-cols-2">
              <F label="New Password (min 8 chars)">
                <input required type="password" minLength={8} className="input" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
              </F>
              <F label="Confirm New Password">
                <input required type="password" minLength={8} className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </F>
            </div>
            <button disabled={pwMut.isPending} className="btn-primary flex items-center justify-center gap-2">
              {pwMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </form>
        </section>
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
