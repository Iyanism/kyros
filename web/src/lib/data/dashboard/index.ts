import type { LucideIcon } from "lucide-react";
import {
  Building2,
  DollarSign,
  Package,
  Warehouse,
} from "lucide-react";

export interface Kpi {
  label: string;
  value: string;
  subtext: string;
  trend: string;
  trendUp: boolean;
  icon: LucideIcon;
  accent: string;
}

export interface ChamberSummary {
  code: string;
  name: string;
  temp: string;
  occupancy: number;
  totalCapacity: string;
  used: string;
  color: string;
  status: string;
}

export type ActivityType = "inbound" | "outbound" | "billing";

export interface ActivityItem {
  id: string;
  title: string;
  client: string;
  time: string;
  type: ActivityType;
  details: string;
}

export type AlertSeverity = "warning" | "info" | "success";

export interface AlertItem {
  severity: AlertSeverity;
  title: string;
  desc: string;
  time: string;
}

export interface VolumePoint {
  day: string;
  height: string;
  val: string;
}

export const KPIS: Kpi[] = [
  {
    label: "Overall Capacity",
    value: "78.4%",
    subtext: "1,568 / 2,000 MT occupied",
    trend: "+4.2%",
    trendUp: true,
    icon: Warehouse,
    accent: "bg-[#2457e6]",
  },
  {
    label: "Active Clients",
    value: "24",
    subtext: "3 new inbound requests",
    trend: "+2 this month",
    trendUp: true,
    icon: Building2,
    accent: "bg-[#0d9488]",
  },
  {
    label: "Pending Fulfillment",
    value: "18",
    subtext: "11 Inbound · 7 Outbound",
    trend: "Requires action",
    trendUp: false,
    icon: Package,
    accent: "bg-[#d97706]",
  },
  {
    label: "Monthly Revenue",
    value: "₹14.82L",
    subtext: "₹2.1L outstanding due",
    trend: "+15.8% YTD",
    trendUp: true,
    icon: DollarSign,
    accent: "bg-[#0284c7]",
  },
];

export const CHAMBER_SUMMARIES: ChamberSummary[] = [
  { code: "CH-A", name: "Chamber A · Deep Frozen", temp: "-25°C", occupancy: 82, totalCapacity: "500 MT", used: "410 MT", color: "bg-[#2457e6]", status: "Near Capacity" },
  { code: "CH-B", name: "Chamber B · Chilled Dairy", temp: "+4°C", occupancy: 64, totalCapacity: "450 MT", used: "288 MT", color: "bg-[#0d9488]", status: "Optimal" },
  { code: "CH-C", name: "Chamber C · Frozen Meat", temp: "-18°C", occupancy: 48, totalCapacity: "400 MT", used: "192 MT", color: "bg-[#3b82f6]", status: "Available" },
  { code: "CH-D", name: "Chamber D · Pharma Ambient", temp: "+15°C", occupancy: 91, totalCapacity: "300 MT", used: "273 MT", color: "bg-[#d97706]", status: "Critical" },
  { code: "CH-E", name: "Chamber E · Blast Freezer", temp: "-30°C", occupancy: 35, totalCapacity: "200 MT", used: "70 MT", color: "bg-[#6366f1]", status: "Available" },
  { code: "CH-F", name: "Chamber F · Produce Chilled", temp: "+2°C", occupancy: 72, totalCapacity: "350 MT", used: "252 MT", color: "bg-[#059669]", status: "Optimal" },
];

export const RECENT_ACTIVITIES: ActivityItem[] = [
  { id: "INB-204", title: "Inbound Order Approved & Assigned", client: "Meridian Foods", time: "12 mins ago", type: "inbound", details: "18 MT Frozen Seafood → Slot CH-A-R03" },
  { id: "OUT-118", title: "Pick List Generated & Outbound Dispatch", client: "FreshCorp Logistics", time: "42 mins ago", type: "outbound", details: "12 Pallets FIFO Pick Strategy Executed" },
  { id: "INV-042", title: "Invoice Settled via Razorpay", client: "Apex Agritech", time: "2 hours ago", type: "billing", details: "₹42,600 received · Receipt #RCP-9041" },
  { id: "INB-201", title: "Pallet Segregation Completed", client: "BlueOcean Exports", time: "4 hours ago", type: "inbound", details: "24 MT Palletized by Operator R. Kumar" },
];

export const SYSTEM_ALERTS: AlertItem[] = [
  { severity: "warning", title: "Chamber D Capacity Warning", desc: "Occupancy reached 91%. Allocate secondary rack space for upcoming inbound INB-209.", time: "25 mins ago" },
  { severity: "info", title: "FEFO Expiry Recommendation", desc: "Batch #B-881 (Meridian) expiring in 14 days. Priority flag attached to outbound pick list.", time: "1 hour ago" },
  { severity: "success", title: "System Backup Completed", desc: "Database snapshot & slot audit trail synced successfully.", time: "3 hours ago" },
];

export const VOLUME_BY_DAY: VolumePoint[] = [
  { day: "Mon", height: "45%", val: "24" },
  { day: "Tue", height: "65%", val: "38" },
  { day: "Wed", height: "85%", val: "52" },
  { day: "Thu", height: "55%", val: "31" },
  { day: "Fri", height: "95%", val: "64" },
  { day: "Sat", height: "70%", val: "42" },
  { day: "Sun", height: "35%", val: "18" },
];
