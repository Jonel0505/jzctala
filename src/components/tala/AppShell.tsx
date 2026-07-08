import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Table as TableIcon,
  FileEdit,
  Presentation,
  ClipboardCheck,
  Award,
  RefreshCw,
  Languages,
  FolderOpen,
  Settings as SettingsIcon,
  LogOut,
  Shield,
  ChevronDown,
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
import { getSiteContent } from "@/lib/public.functions";
import { initials } from "@/lib/tala-utils";
import { AvatarImg } from "./AvatarImg";
import { TalaAssistant } from "./TalaAssistant";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  moduleKey?: string;
  disabled?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lesson-plans", label: "Lesson Plan Maker", icon: FileText, moduleKey: "lesson_plan" },
  { to: "/tos", label: "Automated TOS with Test Generator", icon: TableIcon, moduleKey: "tos" },
  { to: "/worksheet", label: "Worksheet Maker", icon: FileEdit },
  { to: "/ppt", label: "PPT Maker", icon: Presentation },
  { to: "/assessments", label: "Assessment Maker", icon: ClipboardCheck, moduleKey: "assessment" },
  { to: "/rubric", label: "Rubric Maker", icon: Award },
  { to: "/rewriter", label: "Text Rewriter", icon: RefreshCw },
  { to: "/translator", label: "Text Translator", icon: Languages },
];

const SECONDARY: NavItem[] = [
  { to: "/documents", label: "My Documents", icon: FolderOpen, moduleKey: "documents" },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f6f8fc]">
        <TalaSidebar />
        <div className="flex flex-1 min-w-0 flex-col">
          <TopBar title={title} />
          <div className="sr-only">{title}</div>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
        <TalaAssistant />
      </div>
    </SidebarProvider>
  );
}

function TalaSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchProfile = useServerFn(getMyProfile);
  const fetchSite = useServerFn(getSiteContent);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: site } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });
  const isAdmin = me?.roles.includes("admin");
  const modulesEnabled = new Set((site?.modules ?? []).filter((m) => m.enabled).map((m) => m.key));
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const displayName = me?.profile
    ? [me.profile.first_name, me.profile.last_name].filter(Boolean).join(" ") || "Teacher"
    : "Teacher";

  const filtered = PRIMARY.filter((n) => !n.moduleKey || modulesEnabled.has(n.moduleKey) || !n.moduleKey);

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
              <div className="mt-1 text-[10px] leading-tight text-white/60">
                Teaching Automation for
                <br />
                Lesson Planning &amp; Assessment
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-navy text-navy-foreground">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-white/50">Tools</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {filtered.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="text-white/85 hover:bg-white/10 hover:text-white data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link to={item.to}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-white/50">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="text-white/85 hover:bg-white/10 hover:text-white data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link to={item.to}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/admin")}
                    tooltip="Admin Portal"
                    className="text-white/85 hover:bg-white/10 hover:text-white data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link to="/admin">
                      <Shield className="h-4 w-4" />
                      <span>Admin Portal</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-navy text-navy-foreground">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
          <AvatarImg
            path={me?.profile?.avatar_url ?? null}
            fallback={initials(me?.profile?.first_name, me?.profile?.last_name)}
            className="h-9 w-9 shrink-0 rounded-full ring-2 ring-white/20"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{displayName}</div>
              <div className="truncate text-[10px] text-white/60">
                {isAdmin ? "Administrator" : "Teacher"}
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar({ title }: { title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const [userMenu, setUserMenu] = useState(false);
  const isAdmin = me?.roles.includes("admin");

  useEffect(() => {
    if (me?.profile && me.profile.status !== "approved") {
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
              <Link
                to="/settings"
                onClick={() => setUserMenu(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <SettingsIcon className="h-4 w-4" /> Account Settings
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setUserMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  <Shield className="h-4 w-4" /> Admin Portal
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
