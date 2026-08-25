import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — TALA" }, { name: "robots", content: "noindex" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please log in.");
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login" } });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-primary/10 to-background p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-xl">
        <h1 className="text-xl font-bold">Set a new password</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        ) : (
          <>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <button className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">
              Update password
            </button>
          </>
        )}
      </form>
    </div>
  );
}
