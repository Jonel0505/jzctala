import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  FileEdit,
  ToggleLeft,
  Activity,
  Megaphone,
  ArrowLeft,
  LogOut,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/approvals", label: "User Approval", icon: UserCheck },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/content", label: "Website Content", icon: FileEdit },
  { to: "/admin/modules", label: "Portal Management", icon: ToggleLeft },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/logs", label: "Activity Logs", icon: Activity },
];

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">TALA Admin</div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-snug text-sidebar-foreground/70">
            Administration Portal
          </p>
        </div>
        <nav className="flex-1 px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
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
          <Link
            to="/dashboard"
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Teacher View</span>
          </Link>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b bg-card/80 px-4 md:px-6">
          <div className="text-sm font-semibold text-muted-foreground">{title}</div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
