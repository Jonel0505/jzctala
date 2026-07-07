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
  Users2,
  Bot,
  FolderOpen,
  Bookmark,
  Download,
  Calendar,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Shield,
  Search,
  Mail,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/user.functions";
import { getSiteContent } from "@/lib/public.functions";
import { initials } from "@/lib/tala-utils";
import { AvatarImg } from "./AvatarImg";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  moduleKey?: string;
  badge?: string;
  disabled?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lesson-plans", label: "Lesson Plan Maker", icon: FileText, moduleKey: "lesson_plan" },
  { to: "/tos", label: "Automated TOS with Test Generator", icon: TableIcon, moduleKey: "tos" },
  { to: "/worksheet", label: "Worksheet Maker", icon: FileEdit, disabled: true },
  { to: "/ppt", label: "PPT Maker", icon: Presentation, disabled: true },
  { to: "/assessments", label: "Assessment Maker", icon: ClipboardCheck, moduleKey: "assessment" },
  { to: "/rubric", label: "Rubric Maker", icon: Award, disabled: true },
  { to: "/rewriter", label: "Text Rewriter", icon: RefreshCw, disabled: true },
  { to: "/translator", label: "Text Translator", icon: Languages, disabled: true },
  { to: "/group", label: "Group Work Generator", icon: Users2, disabled: true },
  { to: "/ai", label: "AI Assistant", icon: Bot, disabled: true, badge: "NEW" },
];

const SECONDARY: NavItem[] = [
  { to: "/documents", label: "My Documents", icon: FolderOpen, moduleKey: "documents" },
  { to: "/saved", label: "Saved Resources", icon: Bookmark, disabled: true },
  { to: "/downloads", label: "Downloads", icon: Download, disabled: true },
  { to: "/calendar", label: "Calendar", icon: Calendar, disabled: true },
  { to: "/notifications", label: "Notifications", icon: Bell, disabled: true, badge: "5" },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchProfile = useServerFn(getMyProfile);
  const fetchSite = useServerFn(getSiteContent);
  const [userMenu, setUserMenu] = useState(false);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const { data: site } = useQuery({ queryKey: ["site"], queryFn: () => fetchSite() });

  const isAdmin = me?.roles.includes("admin");
  const modulesEnabled = new Set(
    (site?.modules ?? []).filter((m) => m.enabled).map((m) => m.key),
  );

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

  const displayName = me?.profile
    ? [me.profile.first_name, me.profile.last_name].filter(Boolean).join(" ") || "Teacher"
    : "Teacher";
  const role = isAdmin ? "Administrator" : "Teacher";

  return (
    <div className="flex min-h-screen w-full bg-[#f6f8fc]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col bg-navy text-navy-foreground">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/10">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-navy shadow-lg">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 2l2.09 4.26L18.5 7 15 10.5 15.82 15 12 12.77 8.18 15 9 10.5 5.5 7l4.41-.74z"/></svg>
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tight leading-none">TALA</div>
            <div className="mt-1 text-[10px] leading-tight text-white/60">
              Teaching Automation for<br />Lesson Planning and Assessment
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
          {PRIMARY.filter((n) => !n.moduleKey || modulesEnabled.has(n.moduleKey) || n.disabled).map((item) => (
            <NavLink key={item.to} item={item} active={pathname === item.to || pathname.startsWith(item.to + "/")} />
          ))}
          <div className="my-3 border-t border-white/10" />
          {SECONDARY.map((item) => (
            <NavLink key={item.to} item={item} active={pathname === item.to} />
          ))}
          {isAdmin && (
            <>
              <div className="my-3 border-t border-white/10" />
              <NavLink
                item={{ to: "/admin", label: "Admin Portal", icon: Shield }}
                active={pathname.startsWith("/admin")}
              />
            </>
          )}
        </nav>

        {/* Profile card */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <AvatarImg
              path={me?.profile?.avatar_url ?? null}
              fallback={initials(me?.profile?.first_name, me?.profile?.last_name)}
              className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/20"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{displayName}</div>
              <div className="truncate text-[11px] text-white/60">{role}</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded p-1.5 text-white/70 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 min-w-0 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur md:px-6">
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden">
            <LayoutDashboard className="h-5 w-5" />
          </button>
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search anything..."
              className="h-10 w-full rounded-full border bg-muted/40 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-card"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <IconBtn count={5}><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn count={2}><Mail className="h-4 w-4" /></IconBtn>
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
                <div className="absolute right-0 top-11 z-30 w-52 rounded-xl border bg-card p-1.5 shadow-xl">
                  <Link to="/settings" onClick={() => setUserMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <SettingsIcon className="h-4 w-4" /> Account Settings
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <Shield className="h-4 w-4" /> Admin Portal
                    </Link>
                  )}
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

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
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
      {item.badge && (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
          {item.badge}
        </span>
      )}
    </>
  );
  if (item.disabled) return <div className={cls} title="Coming soon">{inner}</div>;
  return <Link to={item.to} className={cls}>{inner}</Link>;
}

function IconBtn({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted">
      {children}
      {count && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
