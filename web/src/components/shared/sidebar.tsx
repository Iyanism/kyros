import { Link, useLocation, useNavigate } from "react-router";
import { LogOut, X } from "lucide-react";
import { KyrosLogo } from "@/components/shared/logo";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/utils/string-operations";
import {
  getSidebarNavForRole,
  type RoleSidebarNav,
  type SidebarNavItem as SidebarNavItemType,
} from "@/lib/data/sidebar-nav";
import type { UserRole } from "@/types/user";

export function BrandHeader() {
  return (
    <div className="flex h-16 items-center justify-between px-6 border-b border-[#e2e8f0]">
      <KyrosLogo dark />
      <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#2457e6]">
        v2.0
      </span>
    </div>
  );
}

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  badge,
  href,
  onClick,
}: SidebarNavItemType & { active?: boolean; onClick?: () => void }) {
  const className = `group flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-all ${
    active
      ? "bg-[#2457e6] text-white font-semibold shadow-[0_4px_12px_rgba(36,87,230,0.25)]"
      : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
  }`;

  return (
    <Link to={href} onClick={onClick} className={className}>
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

export function SidebarNav({
  navData,
  onItemClick,
}: {
  navData: RoleSidebarNav;
  onItemClick?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] px-2 mb-2">
          Main Menu
        </div>
        <nav className="space-y-1">
          {navData.mainMenu.map((item) => (
            <SidebarItem
              key={item.label}
              {...item}
              active={item.href === pathname}
              {...(onItemClick ? { onClick: onItemClick } : {})}
            />
          ))}
        </nav>
      </div>

      {navData.managementMenu && navData.managementMenu.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8] px-2 mb-2">
            Management
          </div>
          <nav className="space-y-1">
            {navData.managementMenu.map((item) => (
              <SidebarItem
                key={item.label}
                {...item}
                active={item.href === pathname}
                {...(onItemClick ? { onClick: onItemClick } : {})}
              />
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

export function SidebarUserCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    void logout();
    navigate("/");
  };

  return (
    <div className="mt-auto border-t border-[#e2e8f0] p-4 bg-[#f1f5f9]/50">
      <div className="flex items-center gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-2.5 shadow-sm">
        <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] font-semibold flex items-center justify-center text-sm border border-[#2457e6]/20 uppercase">
          {getInitials(user?.full_name || "")}
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
          onClick={handleLogout}
          className="text-[#94a3b8] hover:text-[#ef4444] transition-colors p-1.5 rounded-md hover:bg-[#f1f5f9]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role?: UserRole }) {
  const { user } = useAuth();
  const currentRole = role ?? user?.role;
  const navData = getSidebarNavForRole(currentRole);

  return (
    <aside className="hidden lg:flex lg:w-65 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-[#f8fafc] border-r border-[#e2e8f0] z-20">
      <BrandHeader />
      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <SidebarNav navData={navData} />
      </div>
      <SidebarUserCard />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role?: UserRole;
}) {
  const { user } = useAuth();
  const currentRole = role ?? user?.role;
  const navData = getSidebarNavForRole(currentRole);

  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs z-40"
          onClick={onClose}
        />
      )}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-67.5 bg-[#f8fafc] border-r border-[#e2e8f0] transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#e2e8f0]">
          <KyrosLogo dark />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-[#64748b] hover:text-[#0f172a]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SidebarNav navData={navData} onItemClick={onClose} />
        </div>

        <SidebarUserCard />
      </aside>
    </>
  );
}
