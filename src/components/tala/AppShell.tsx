import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Table,
  ClipboardCheck,
  FolderOpen,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Shield,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/user.functions";
import { getSiteContent } from "@/lib/public.functions";
import { initials } from "@/lib/tala-utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  moduleKey?: string;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tos", label: "Automated TOS Portal", icon: Table, moduleKey: "tos" },
  { to: "/lesson-plans", label: "Lesson Plan Generator", icon: FileText, moduleKey: "lesson_plan" },
  { to: "/assessments", label: "Assessment Generator", icon: ClipboardCheck, moduleKey: "assessment" },
  { to: "/documents", label: "My Documents", icon: FolderOpen, moduleKey: "documents" },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchProfile = useServerFn(getMyProfile);
  const fetchSite = useServerFn(getSiteContent);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: site } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });

  const isAdmin = me?.roles.includes("admin");
  const modulesEnabled = new Set(
    (site?.modules ?? []).filter((m) => m.enabled).map((m) => m.key),
  );

  useEffect(() => {
    if (me?.profile && me.profile.status !== "approved") {
      // Not approved; redirect to auth with message
      supabase.auth.signOut().then(() => navigate({ to: "/auth", search: { pending: "1" } }));
    }
  }, [me, navigate]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
        <div className="px-6 pt-6 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">TALA</div>
            </div>
          </Link>
          <p className="mt-3 text-xs leading-snug text-sidebar-foreground/70">
            Teaching Automation for Lesson Planning and Assessment
          </p>
        </div>

        <nav className="flex-1 px-3 py-2">
          {NAV.filter((n) => !n.moduleKey || modulesEnabled.has(n.moduleKey)).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent")
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={
                "mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                (pathname.startsWith("/admin")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent")
              }
            >
              <Shield className="h-4 w-4" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              {initials(me?.profile?.first_name, me?.profile?.last_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {me?.profile?.first_name || "Teacher"}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/70">Welcome back!</div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur md:px-6">
          <div className="text-sm font-semibold text-muted-foreground">{title}</div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(me?.profile?.first_name, me?.profile?.last_name)}
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
