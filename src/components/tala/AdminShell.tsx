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
  ChevronDown,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/user.functions";
import { adminStats } from "@/lib/admin.functions";
import { initials } from "@/lib/tala-utils";
import { AvatarImg } from "./AvatarImg";
import { TalaAssistant } from "./TalaAssistant";
import { useDeviceGuard } from "@/hooks/use-device-guard";
import { TalaFooter } from "./TalaFooter";

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
  useDeviceGuard();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 min-w-0 flex-col">
          <AdminTopBar title={title} />
          <div className="sr-only">{title}</div>
          <main className="flex-1 min-w-0">{children}</main>
          <TalaFooter />
        </div>
        <TalaAssistant />
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchProfile = useServerFn(getMyProfile);
  const fetchStats = useServerFn(adminStats);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const badges = { pending: stats?.pending ?? 0 };

  const displayName = me?.profile
    ? [me.profile.first_name, me.profile.last_name].filter(Boolean).join(" ") || "Admin"
    : "Admin";

  return (
    <Sidebar collapsible="icon" className="border-r-0 [--sidebar-width:17rem]">
      <SidebarHeader className="bg-navy text-navy-foreground">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-navy shadow-lg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 2l2.09 4.26L18.5 7 15 10.5 15.82 15 12 12.77 8.18 15 9 10.5 5.5 7l4.41-.74z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xl font-black leading-none tracking-tight">TALA</div>
              <div className="mt-1 text-[10px] font-bold tracking-widest text-white/60">
                ADMIN PORTAL
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-navy text-navy-foreground">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-white/50">Admin</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                const btn = (
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={active}
                    tooltip={item.label}
                    className={
                      "text-white/85 hover:bg-white/10 hover:text-white data-[active=true]:bg-primary data-[active=true]:text-primary-foreground " +
                      (item.disabled ? "cursor-not-allowed opacity-50" : "")
                    }
                    aria-disabled={item.disabled || undefined}
                  >
                    {item.disabled ? (
                      <span>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                    ) : (
                      <Link to={item.to}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {badge > 0 && !collapsed && (
                          <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                            {badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </SidebarMenuButton>
                );
                return <SidebarMenuItem key={item.to}>{btn}</SidebarMenuItem>;
              })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to Teacher View" className="text-white/85 hover:bg-white/10 hover:text-white">
                  <Link to="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Teacher View</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-navy text-navy-foreground">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
          <div className="relative">
            <AvatarImg
              path={me?.profile?.avatar_url ?? null}
              fallback={initials(me?.profile?.first_name, me?.profile?.last_name)}
              className="h-9 w-9 rounded-full ring-2 ring-white/20"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-navy" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{displayName}</div>
              <div className="truncate text-[10px] text-emerald-300">● Online</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminTopBar({ title }: { title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const [userMenu, setUserMenu] = useState(false);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="text-muted-foreground" />
      {title && (
        <div className="hidden md:block">
          <div className="text-sm font-bold text-navy">{title}</div>
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setUserMenu((v) => !v)}
            className="flex items-center gap-1.5 rounded-full pr-2 hover:bg-muted"
          >
            <AvatarImg
              path={me?.profile?.avatar_url ?? null}
              fallback={initials(me?.profile?.first_name, me?.profile?.last_name)}
              className="h-9 w-9 rounded-full ring-2 ring-primary/20"
            />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {userMenu && (
            <div
              className="absolute right-0 top-11 z-30 w-52 rounded-xl border bg-card p-1.5 shadow-xl"
              onMouseLeave={() => setUserMenu(false)}
            >
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
  );
}

export function useAdminShieldIcon() {
  return Shield;
}
