import {
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/user";

export interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  badge?: string;
  href: string;
}

export interface RoleSidebarNav {
  mainMenu: SidebarNavItem[];
  managementMenu?: SidebarNavItem[];
}

export const ADMIN_NAV: RoleSidebarNav = {
  mainMenu: [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Warehouse, label: "Chambers", href: "/chamber" },
    { icon: Package, label: "Inbound Orders", badge: "3", href: "/inbound" },
    { icon: Truck, label: "Outbound Orders", badge: "2", href: "/outbound" },
    { icon: CreditCard, label: "Billing & Invoices", badge: "1", href: "/billing" },
  ],
  managementMenu: [
    { icon: Users, label: "Users & Staff", href: "/users" },
    { icon: Building2, label: "Clients Master", href: "/clients" },
    { icon: BarChart3, label: "Reports & Analytics", href: "/reports" },
    { icon: Settings, label: "System Settings", href: "/settings" },
  ],
};

export const OPERATOR_NAV: RoleSidebarNav = {
  mainMenu: [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Package, label: "Inbound Execution", badge: "3", href: "/inbound" },
    { icon: Truck, label: "Outbound Execution", badge: "2", href: "/outbound" },
    { icon: Warehouse, label: "Chambers Map", href: "/chamber" },
    { icon: Boxes, label: "Inventory Lookup", href: "/inventory" },
  ],
};

export const CLIENT_NAV: RoleSidebarNav = {
  mainMenu: [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Boxes, label: "My Inventory", href: "/inventory" },
    { icon: Package, label: "Inbound Orders", href: "/inbound" },
    { icon: Truck, label: "Outbound Orders", href: "/outbound" },
    { icon: CreditCard, label: "Billing & Invoices", href: "/billing" },
  ],
};

export const ROLE_SIDEBAR_NAV: Record<UserRole, RoleSidebarNav> = {
  admin: ADMIN_NAV,
  operator: OPERATOR_NAV,
  client: CLIENT_NAV,
};

export function getSidebarNavForRole(role?: UserRole | null): RoleSidebarNav {
  if (!role || !ROLE_SIDEBAR_NAV[role]) {
    return ADMIN_NAV;
  }
  return ROLE_SIDEBAR_NAV[role];
}
