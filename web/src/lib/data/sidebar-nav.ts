import {
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  History,
  LayoutDashboard,
  Package,
  Truck,
  Users,
  UserRound,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/user";

export interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
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
    { icon: Boxes, label: "Inventory Lookup", href: "/inventory" },
    { icon: History, label: "Stock Movements", href: "/stock-movements" },
    { icon: Package, label: "Inbound Orders", href: "/inbound" },
    { icon: Truck, label: "Outbound Orders", href: "/outbound" },
    { icon: CreditCard, label: "Billing & Invoices", href: "/billing" },
    { icon: UserRound, label: "My Account", href: "/account" },
  ],
  managementMenu: [
    { icon: Users, label: "Users & Staff", href: "/users" },
    { icon: Building2, label: "Clients Master", href: "/clients" },
    { icon: BarChart3, label: "Reports & Analytics", href: "/reports" },
  ],
};

export const OPERATOR_NAV: RoleSidebarNav = {
  mainMenu: [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Package, label: "Inbound Execution", href: "/inbound" },
    { icon: Truck, label: "Outbound Execution", href: "/outbound" },
    { icon: Warehouse, label: "Chambers Map", href: "/chamber" },
    { icon: Boxes, label: "Inventory Lookup", href: "/inventory" },
    { icon: History, label: "Stock Movements", href: "/stock-movements" },
    { icon: UserRound, label: "My Account", href: "/account" },
  ],
};

export const CLIENT_NAV: RoleSidebarNav = {
  mainMenu: [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Boxes, label: "My Inventory", href: "/inventory" },
    { icon: History, label: "Stock Movements", href: "/stock-movements" },
    { icon: Package, label: "Inbound Orders", href: "/inbound" },
    { icon: Truck, label: "Outbound Orders", href: "/outbound" },
    { icon: CreditCard, label: "Billing & Invoices", href: "/billing" },
    { icon: UserRound, label: "My Account", href: "/account" },
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
