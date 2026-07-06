import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["login", "register", "forgot"]).optional().default("login").catch("login"),
  pending: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TALA" },
      { name: "description", content: "Sign in or register for TALA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const { mode, pending } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [reg, setReg] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    employee_id: "",
    school: "",
    division: "",
    region: "",
    position: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  });

  useEffect(() => {
    if (pending === "1") {
      toast.info("Your account is awaiting administrator approval.");
    }
  }, [pending]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Check profile status
      const { data: profile } = await supabase
        .from("profiles")
        .select("status,denial_reason")
        .eq("id", data.user.id)
        .single();
      if (!profile || profile.status !== "approved") {
        await supabase.auth.signOut();
        if (profile?.status === "denied") {
          toast.error(`Your registration was denied. ${profile.denial_reason ?? ""}`);
        } else if (profile?.status === "disabled") {
          toast.error("Your account has been disabled.");
        } else {
          toast.info("Your account is still awaiting administrator approval.");
        }
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reg.agree) return toast.error("Please agree to the terms.");
    if (reg.password !== reg.confirm) return toast.error("Passwords do not match.");
    if (reg.password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: reg.email,
        password: reg.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: reg.first_name,
            middle_name: reg.middle_name,
            last_name: reg.last_name,
            employee_id: reg.employee_id,
            school: reg.school,
            division: reg.division,
            region: reg.region,
            position: reg.position,
          },
        },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Registration successful! Awaiting administrator approval.");
      navigate({ to: "/auth", search: { mode: "login" } });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email.");
      navigate({ to: "/auth", search: { mode: "login" } });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-navy/5">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="grid w-full gap-10 md:grid-cols-2 md:items-center">
          <div className="hidden md:block">
            <Link to="/" className="mb-6 flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-navy-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">TALA</span>
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight text-navy">
              Teaching that inspires. <br /> Tools that empower.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Join TALA — the intelligent platform helping Filipino teachers plan, generate, and assess with confidence.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-xl md:p-8">
            <div className="mb-6 flex gap-2 rounded-lg bg-muted p-1 text-sm font-semibold">
              <button
                onClick={() => navigate({ to: "/auth", search: { mode: "login" } })}
                className={`flex-1 rounded-md px-3 py-2 ${mode === "login" ? "bg-card shadow" : "text-muted-foreground"}`}
              >
                Login
              </button>
              <button
                onClick={() => navigate({ to: "/auth", search: { mode: "register" } })}
                className={`flex-1 rounded-md px-3 py-2 ${mode === "register" ? "bg-card shadow" : "text-muted-foreground"}`}
              >
                Register
              </button>
            </div>

            {mode === "login" && (
              <form onSubmit={doLogin} className="space-y-4">
                <h2 className="text-xl font-bold">Welcome back</h2>
                <Field label="Email">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                </Field>
                <Field label="Password">
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
                </Field>
                <button disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Login"}
                </button>
                <div className="text-center text-sm">
                  <button type="button" onClick={() => navigate({ to: "/auth", search: { mode: "forgot" } })} className="text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              </form>
            )}

            {mode === "register" && (
              <form onSubmit={doRegister} className="space-y-4">
                <h2 className="text-xl font-bold">Create your account</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="First Name"><input required className="input" value={reg.first_name} onChange={(e) => setReg({ ...reg, first_name: e.target.value })} /></Field>
                  <Field label="Middle Name"><input className="input" value={reg.middle_name} onChange={(e) => setReg({ ...reg, middle_name: e.target.value })} /></Field>
                  <Field label="Last Name"><input required className="input" value={reg.last_name} onChange={(e) => setReg({ ...reg, last_name: e.target.value })} /></Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Employee ID"><input className="input" value={reg.employee_id} onChange={(e) => setReg({ ...reg, employee_id: e.target.value })} /></Field>
                  <Field label="Position"><input className="input" value={reg.position} onChange={(e) => setReg({ ...reg, position: e.target.value })} placeholder="e.g. Teacher I" /></Field>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="School"><input className="input" value={reg.school} onChange={(e) => setReg({ ...reg, school: e.target.value })} /></Field>
                  <Field label="Division"><input className="input" value={reg.division} onChange={(e) => setReg({ ...reg, division: e.target.value })} /></Field>
                  <Field label="Region"><input className="input" value={reg.region} onChange={(e) => setReg({ ...reg, region: e.target.value })} /></Field>
                </div>
                <Field label="Email"><input type="email" required className="input" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} /></Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Password"><input type="password" required minLength={8} className="input" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} /></Field>
                  <Field label="Confirm Password"><input type="password" required className="input" value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} /></Field>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={reg.agree} onChange={(e) => setReg({ ...reg, agree: e.target.checked })} />
                  I agree to the Terms of Service and Privacy Policy
                </label>
                <button disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Register"}
                </button>
                <p className="text-center text-xs text-muted-foreground">Your account will require administrator approval before you can log in.</p>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={doForgot} className="space-y-4">
                <h2 className="text-xl font-bold">Reset your password</h2>
                <Field label="Email">
                  <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <button disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Send reset link"}
                </button>
                <div className="text-center text-sm">
                  <button type="button" onClick={() => navigate({ to: "/auth", search: { mode: "login" } })} className="text-primary hover:underline">
                    Back to login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .input { display:block; width:100%; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-card); padding:0.55rem 0.75rem; font-size:0.9rem; }
        .input:focus { outline:2px solid var(--color-ring); outline-offset:1px; }
        .btn-primary { display:block; width:100%; border-radius:0.5rem; background:var(--color-primary); color:var(--color-primary-foreground); padding:0.7rem 1rem; font-weight:600; font-size:0.9rem; }
        .btn-primary:hover { opacity:0.92; }
        .btn-primary:disabled { opacity:0.6; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
