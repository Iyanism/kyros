import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Snowflake,
  Truck,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/store/authStore";

export interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  badge?: string;
  href: string;
}

const MAIN_MENU: SidebarNavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Warehouse, label: "Chambers", href: "/chamber" },
  { icon: Package, label: "Inbound Orders", badge: "3", href: "/inbound" },
  { icon: Truck, label: "Outbound Orders", badge: "2", href: "/outbound" },
  { icon: CreditCard, label: "Billing & Invoices", badge: "1", href: "/billing" },
];

const MANAGEMENT_MENU: SidebarNavItem[] = [
  { icon: Users, label: "Users & Staff", href: "/users" },
  { icon: Building2, label: "Clients Master", href: "/clients" },
  { icon: BarChart3, label: "Reports & Analytics", href: "/reports" },
  { icon: Settings, label: "System Settings", href: "/settings" },
];

function getInitials(user: AuthUser | null): string {
  if (!user) return "--";
  const parts = user.email.split("@")[0].split(/[._-]/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
}

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  badge,
  href,
}: SidebarNavItem & { active?: boolean }) {
  const className = `group flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-all ${
    active
      ? "bg-[#2457e6] text-white font-semibold shadow-[0_4px_12px_rgba(36,87,230,0.25)]"
      : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
  }`;

  return (
    <Link to={href} className={className}>
      <Icon
        className={`h-4.5 w-4.5 ${active ? "text-white" : "text-[#64748b] group-hover:text-[#0f172a]"}`}
      />
      <span className="flex-1">{label}</span>
      {badge && (
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
            active ? "bg-white/20 text-white" : "bg-[#e2e8f0] text-[#475569]"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function SidebarNav({ items }: { items: SidebarNavItem[] }) {
  const { pathname } = useLocation();
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <SidebarItem key={item.label} {...item} active={item.href === pathname} />
      ))}
    </nav>
  );
}

export function BrandHeader() {
  return (
    <div className="flex h-16 items-center gap-3 px-6 border-b border-[#e2e8f0]">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2457e6] text-white shadow-[0_4px_12px_rgba(36,87,230,0.25)]">
        <Snowflake className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="font-display text-[21px] font-semibold tracking-[-0.055em] text-[#11203a]">
        kyros
      </span>
      <span className="ml-auto rounded-md bg-[#eef2ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#2457e6]">
        v2.0
      </span>
    </div>
  );
}

export function SidebarUserCard() {
  const { user, logout } = useAuth();
  return (
    <div className="mt-auto border-t border-[#e2e8f0] p-4 bg-[#f1f5f9]/50">
      <div className="flex items-center gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-2.5 shadow-sm">
        <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] font-semibold flex items-center justify-center text-sm border border-[#2457e6]/20 uppercase">
          {getInitials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#0f172a] truncate">
            {user?.email ?? "Signed in"}
          </div>
          <div className="text-[10px] font-medium text-[#64748b] truncate capitalize">
            {user?.role ?? "member"} · Kyros Storage
          </div>
        </div>
        <button
          type="button"
          aria-label="Log out"
          onClick={() => void logout()}
          className="text-[#94a3b8] hover:text-[#ef4444] transition-colors p-1.5 rounded-md hover:bg-[#f1f5f9]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-65 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-[#f8fafc] border-r border-[#e2e8f0] z-20">
      <BrandHeader />
      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] px-2 mb-2">
          Main Menu
        </div>
        <SidebarNav items={MAIN_MENU} />
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] px-2 mt-6 mb-2">
          Management
        </div>
        <SidebarNav items={MANAGEMENT_MENU} />
      </div>
      <SidebarUserCard />
    </aside>
  );
}

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs z-40"
          onClick={onClose}
        />
      )}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-67.5 bg-[#f8fafc] border-r border-[#e2e8f0] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#2457e6] text-white">
              <Snowflake className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="font-display text-[20px] font-semibold tracking-[-0.055em] text-[#11203a]">
              kyros
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-[#64748b] hover:text-[#0f172a]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {[...MAIN_MENU, ...MANAGEMENT_MENU].map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>
      </aside>
    </>
  );
}

export function DashboardHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-10 bg-[#f4f6fa]/90 backdrop-blur-md border-b border-[#e2e8f0] px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-[20px] font-semibold tracking-[-0.03em] text-[#0f172a]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[12px] text-[#64748b]">{subtitle}</p>
            )}
          </div>
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </header>
    </>
  );
}
