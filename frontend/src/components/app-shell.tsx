import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  Search,
  Users,
  Settings,
  HelpCircle,
  LayoutGrid,
  Calendar,
  CalendarX,
  CreditCard,
  Network,
  BarChart3,
  Menu,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { apiGet, USE_MOCK } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { UnreadCount } from "@/types/api";
import { BrandMark } from "./brand-mark";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./ui/sheet";

type NavItem = {
  to: string;
  label: string;
  permission?: string;
  roles?: string[];
  icon: typeof LayoutGrid;
};

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/employees", label: "Employees", permission: "employees.read", roles: ["ADMIN", "HR_MANAGER", "HR"], icon: Users },
  { to: "/departments", label: "Structure", permission: "employees.read", roles: ["ADMIN", "HR_MANAGER", "HR"], icon: Network },
  { to: "/attendance", label: "Attendance", permission: "employees.read", roles: ["ADMIN", "HR_MANAGER", "HR"], icon: Calendar },
  { to: "/leave", label: "Leave", permission: "manager.read", roles: ["MANAGER", "ADMIN", "HR_MANAGER"], icon: CalendarX },
  { to: "/payroll", label: "Payroll", permission: "payroll.read", roles: ["ADMIN", "HR_MANAGER", "PAYROLL"], icon: CreditCard },
  { to: "/reports", label: "Reports", permission: "reports.read", roles: ["ADMIN", "HR_MANAGER", "HR"], icon: BarChart3 },
];

export function AppShell() {
  const { logout, user, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const items = navItems.filter((item) => {
    const permissionOk = item.permission ? hasPermission(item.permission) : true;
    const roleOk = item.roles ? item.roles.some((role) => hasRole(role)) : true;
    return permissionOk && roleOk;
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => apiGet<UnreadCount>("/notifications/me/unread-count"),
    enabled: hasPermission("notifications.read"),
  });

  const initials = useMemo(() => user?.email.slice(0, 2).toUpperCase() ?? "HR", [user?.email]);

  const mobileNavClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group flex items-center gap-3 rounded-[1rem] px-4 py-3.5 transition-all font-medium",
      isActive
        ? "bg-[#00346f] text-white shadow-lg shadow-[#00346f]/20 font-bold"
        : "text-[#737783] hover:bg-[#f7f9fb] hover:text-[#00346f]",
    );

  const renderNavigation = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => mobileNavClassName({ isActive })}
          >
            <Icon className="size-5 transition-transform group-hover:scale-110" />
            <span className="text-[13px] tracking-wide">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  const renderSecondaryActions = (onNavigate?: () => void) => (
    <div className="space-y-1">
      <NavLink
        to="/settings"
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
            isActive
              ? "bg-[#00346f] text-white shadow-lg"
              : "text-[#737783] hover:bg-[#f7f9fb] hover:text-[#00346f]",
          )
        }
      >
        <Settings className="size-5" />
        Settings
      </NavLink>
      <a
        href="#"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#737783] transition-colors hover:bg-[#f7f9fb] hover:text-[#00346f]"
      >
        <HelpCircle className="size-5" />
        Support
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f6] font-sans text-[#191c1e] lg:flex">
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(88vw,22rem)] border-r border-[#eceef0] bg-white p-0"
        >
          <SheetTitle className="sr-only">Primary navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate between the main Architect HRM workspaces.
          </SheetDescription>
          <div className="flex h-full flex-col">
            <div className="px-6 py-8">
              <div className="flex items-center gap-3">
                <BrandMark className="size-11 shrink-0" />
                <div>
                  <h1 className="text-xl font-black font-headline tracking-tighter leading-none text-[#00346f]">
                    Architect HRM
                  </h1>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                    Admin Console
                  </p>
                </div>
              </div>
            </div>

            {renderNavigation(() => setIsMobileNavOpen(false))}

            <div className="shrink-0 border-t border-[#eceef0] p-6">
              {renderSecondaryActions(() => setIsMobileNavOpen(false))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-[#eceef0] bg-white lg:flex">
        <div className="px-8 py-10">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11 shrink-0" />
            <div>
              <h1 className="text-xl font-black font-headline tracking-tighter leading-none text-[#00346f]">Architect HRM</h1>
              <p className="text-[10px] font-bold tracking-widest text-[#737783] mt-1 uppercase">Admin Console</p>
            </div>
          </div>
        </div>
        {renderNavigation()}

        <div className="p-6 space-y-4 shrink-0 border-t border-[#eceef0]">
          {renderSecondaryActions()}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-20 flex-wrap items-center gap-4 border-b border-[#eceef0] bg-white/60 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="inline-flex size-11 items-center justify-center rounded-2xl border border-[#d9dde2] bg-white text-[#191c1e] shadow-sm transition-colors hover:bg-[#f7f9fb] lg:hidden"
            >
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </button>

            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <BrandMark className="size-10 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black font-headline tracking-tight text-[#00346f]">
                  Architect HRM
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#737783]">
                  Admin Console
                </p>
              </div>
            </div>

            <div className="relative hidden w-full max-w-md md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737783] size-4" />
              <input
                type="text"
                placeholder="Search resources, people, or commands..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#f2f4f6]/60 border-none focus:ring-2 focus:ring-[#00346f]/10 rounded-2xl text-[13px] transition-all text-[#191c1e] font-medium placeholder:text-[#737783]/50 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative inline-flex size-11 items-center justify-center rounded-2xl border border-transparent text-[#191c1e] transition-colors hover:border-[#eceef0] hover:bg-white hover:text-[#00346f]"
            >
              <Bell className="size-5" />
              {unreadQuery.data?.unreadCount && unreadQuery.data.unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#ba1a1a] border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                    {unreadQuery.data.unreadCount}
                </span>
              ) : null}
            </button>
            
            <div className="hidden h-6 w-px bg-[#eceef0] sm:block"></div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-4 cursor-pointer group outline-none">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-[#191c1e] leading-tight">{user?.email.split('@')[0].toUpperCase() ?? "STERLING"}</p>
                  <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest mt-0.5">
                    {USE_MOCK ? "Admin Cluster" : "HR Director"}
                  </p>
                </div>
                <Avatar className="size-11 border-2 border-white shadow-md font-bold bg-[#00346f] text-white flex items-center justify-center rounded-2xl">
                  <AvatarFallback className="bg-transparent">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4 text-[#737783] group-hover:text-[#00346f] transition-colors hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="mt-4 w-[min(18rem,calc(100vw-2rem))] rounded-[1.5rem] border-[#eceef0] p-2 shadow-2xl"
              >
                <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer text-sm font-bold text-[#00346f] transition-colors outline-none" onClick={() => navigate('/workspace')}>
                   <LayoutGrid className="size-4 mr-2" /> My Workspace (Self-Service)
                </DropdownMenuItem>
                <div className="h-[1px] bg-[#eceef0] my-2"></div>
                <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer text-sm font-bold text-[#ba1a1a] focus:bg-[#ffdad6] transition-colors outline-none" onClick={logout}>
                   Terminate Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative w-full md:hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737783] size-4" />
            <input
              type="text"
              placeholder="Search resources, people, or commands..."
              className="w-full rounded-2xl bg-[#f2f4f6]/70 py-2.5 pl-11 pr-4 text-[13px] font-medium text-[#191c1e] outline-none transition-all placeholder:text-[#737783]/50 focus:ring-2 focus:ring-[#00346f]/10"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f7f9fb] relative">
          <Outlet />
          <div className="fixed bottom-0 right-0 -mr-32 -mb-32 size-96 bg-[#00346f]/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="pointer-events-none fixed left-1/2 top-0 hidden size-96 -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#00346f]/5 blur-[100px] sm:block lg:left-64 lg:-ml-32 lg:translate-x-0 lg:-translate-y-1/3"></div>
        </main>
      </div>
    </div>
  );
}
