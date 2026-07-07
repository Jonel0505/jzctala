import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  FileEdit,
  ToggleLeft,
  FolderOpen,
  BarChart3,
  Megaphone,
  Settings as SettingsIcon,
  History,
  RotateCcw,
  MessageCircle,
  ArrowLeft,
  LogOut,
  Bell,
  Mail,
  Search,
  ChevronDown,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/user.functions";
import { adminStats } from "@/lib/admin.functions";
import { initials } from "@/lib/tala-utils";
import { AvatarImg } from "./AvatarImg";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badgeKey?: "pending";
  disabled?: boolean;
}

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/approvals", label: "User Approval", icon: UserCheck, badgeKey: "pending" },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/content", label: "Content Management", icon: FileEdit },
  { to: "/admin/modules", label: "Portal Management", icon: ToggleLeft },
  { to: "/admin/documents", label: "Documents & Files", icon: FolderOpen, disabled: true },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3, disabled: true },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/system", label: "System Settings", icon: SettingsIcon, disabled: true },
  { to: "/admin/logs", label: "Activity Logs", icon: History },
  { to: "/admin/backup", label: "Backup & Restore", icon: RotateCcw, disabled: true },
  { to: "/admin/support", label: "Support Messages", icon: MessageCircle, disabled: true },
];

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userMenu, setUserMenu] = useState(false);
  const fetchProfile = useServerFn(getMyProfile);
  const fetchStats = useServerFn(adminStats);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const displayName = me?.profile
    ? [me.profile.first_name, me.profile.last_name].filter(Boolean).join(" ") || "Admin"
    : "Admin";

  const badges = { pending: stats?.pending ?? 0 };

  return (
    <div className="flex min-h-screen w-full bg-[#f6f8fc]">
      <aside className="hidden md:flex w-72 shrink-0 flex-col bg-navy text-navy-foreground">
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/10">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-navy shadow-lg">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 2l2.09 4.26L18.5 7 15 10.5 15.82 15 12 12.77 8.18 15 9 10.5 5.5 7l4.41-.74z"/></svg>
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tight leading-none">TALA</div>
            <div className="mt-1 text-[10px] font-bold tracking-widest text-white/60">ADMIN PORTAL</div>
          </div>
        </div>

        <div className="mx-4 my-3 rounded-xl bg-white/5 p-3 text-xs text-white/70">
          <div className="font-semibold text-white">Empowering teachers.</div>
          <div>Enriching education.</div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            const cls =
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors " +
              (active
                ? "bg-primary text-primary-foreground shadow-sm"
                : item.disabled
                  ? "text-white/50 cursor-not-allowed"
                  : "text-white/85 hover:bg-white/10");
            const inner = (
              <>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 && (
                  <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {badge}
                  </span>
                )}
              </>
            );
            return item.disabled ? (
              <div key={item.to} className={cls} title="Coming soon">{inner}</div>
            ) : (
              <Link key={item.to} to={item.to} className={cls}>{inner}</Link>
            );
          })}
          <div className="my-3 border-t border-white/10" />
          <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/85 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> Back to Teacher View
          </Link>
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="relative">
              <AvatarImg
                path={me?.profile?.avatar_url ?? null}
                fallback={initials(me?.profile?.first_name, me?.profile?.last_name)}
                className="h-10 w-10 rounded-full ring-2 ring-white/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-navy" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{displayName}</div>
              <div className="truncate text-[11px] text-emerald-300">● Online</div>
            </div>
            <button onClick={handleSignOut} className="rounded p-1.5 text-white/70 hover:bg-white/10" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 min-w-0 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur md:px-6">
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search for users, documents, logs..."
              className="h-10 w-full rounded-full border bg-muted/40 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-card"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">5</span>
            </button>
            <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted">
              <Mail className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">2</span>
            </button>
            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-1.5 rounded-full pr-2 hover:bg-muted">
                <AvatarImg
                  path={me?.profile?.avatar_url ?? null}
                  fallback={initials(me?.profile?.first_name, me?.profile?.last_name)}
                  className="h-9 w-9 rounded-full ring-2 ring-primary/20"
                />
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-11 z-30 w-52 rounded-xl border bg-card p-1.5 shadow-xl">
                  <Link to="/settings" onClick={() => setUserMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <SettingsIcon className="h-4 w-4" /> Account Settings
                  </Link>
                  <Link to="/dashboard" onClick={() => setUserMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <ArrowLeft className="h-4 w-4" /> Teacher View
                  </Link>
                  <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="sr-only">{title}</div>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function useAdminShieldIcon() {
  return Shield;
}
