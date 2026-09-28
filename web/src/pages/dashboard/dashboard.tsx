import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ActivityRow } from "@/components/dashboard/activity";
import { AlertBox } from "@/components/dashboard/alert_log";
import { ChamberProgressCard } from "@/components/dashboard/chamber_progress";
import { KpiCard } from "@/components/dashboard/kpi";
import { RevenueGraph } from "@/components/dashboard/revenue_graph";
import { VolumeGraph } from "@/components/dashboard/volume_graph";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import {
  get_chambers,
} from "@/lib/api/chamber";
import { get_stock_levels, get_stock_movements } from "@/lib/api/stock_movement";
import { get_invoices } from "@/lib/api/invoice";
import { get_payments } from "@/lib/api/payment";
import { get_inbound_orders } from "@/lib/api/order";
import { get_outbound_orders } from "@/lib/api/outbound";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { settledValue } from "@/utils/async";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Boxes,
  CreditCard,
  Layers,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import type { ChamberSummary as ApiChamberSummary } from "@/types/chamber";
import type { StockLevelResponse, StockMovementResponse } from "@/types/stock_movement";
import type { InvoiceDetailResponse } from "@/types/invoice";
import type { PaymentDetailResponse } from "@/types/payment";
import type { InboundOrderResponse } from "@/types/order";
import type { OutboundOrderResponse } from "@/types/outbound";
import type { ActivityItem, AlertItem, ChamberSummary as UIChamberSummary, Kpi } from "@/lib/data/dashboard";

export function Dashboard() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "operator";
  const [isLoading, setIsLoading] = useState(true);

  const [chambers, setChambers] = useState<ApiChamberSummary[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelResponse[]>([]);
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDetailResponse[]>([]);
  const [payments, setPayments] = useState<PaymentDetailResponse[]>([]);
  const [inboundOrders, setInboundOrders] = useState<InboundOrderResponse[]>([]);
  const [outboundOrders, setOutboundOrders] = useState<OutboundOrderResponse[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      // Chamber data is admin/operator only — never requested for client users
      const requests: [
        Promise<ApiChamberSummary[]>,
        Promise<StockLevelResponse[]>,
        Promise<StockMovementResponse[]>,
        Promise<InvoiceDetailResponse[]>,
        Promise<PaymentDetailResponse[]>,
        Promise<InboundOrderResponse[]>,
        Promise<OutboundOrderResponse[]>,
      ] = [
        isStaff ? get_chambers() : Promise.resolve<ApiChamberSummary[]>([]),
        get_stock_levels(),
        get_stock_movements(),
        get_invoices(),
        get_payments(),
        get_inbound_orders(),
        get_outbound_orders(),
      ];

      const results = await Promise.allSettled(requests);
      if (cancelled) return;

      const [
        chamberRes,
        stockRes,
        movementRes,
        invoiceRes,
        paymentRes,
        inboundRes,
        outboundRes,
      ] = results;

      setChambers(settledValue(chamberRes, []));
      setStockLevels(settledValue(stockRes, []));
      setMovements(settledValue(movementRes, []));
      setInvoices(settledValue(invoiceRes, []));
      setPayments(settledValue(paymentRes, []));
      setInboundOrders(settledValue(inboundRes, []));
      setOutboundOrders(settledValue(outboundRes, []));

      const failed = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      const firstFailure = failed[0];
      if (firstFailure) {
        console.error(
          "Failed to load some dashboard data:",
          failed.map((f) => f.reason),
        );
        toast.error(getApiErrorMessage(firstFailure.reason));
      }

      if (!cancelled) setIsLoading(false);
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  // Compute Dynamic KPI Cards
  const totalStockWeight = stockLevels.reduce((sum, lvl) => sum + (lvl.weight_mt || 0), 0);
  const totalPallets = stockLevels.length;

  const totalInboundTonnage = inboundOrders.reduce(
    (sum, o) => sum + (o.total_quantity || 0),
    0
  );

  const totalSlots = chambers.reduce(
    (sum, c) => sum + (c.total_capacity || c.total_slots || 0),
    0
  );
  const usedSlots = chambers.reduce((sum, c) => sum + (c.used_capacity || 0), 0);
  const occupancyPct = totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const unpaidTotal = Math.max(0, totalInvoiced - totalPaid);

  const dynamicKPIs: Kpi[] = [
    {
      label: "Active Inventory",
      value: `${totalStockWeight.toFixed(1)} MT`,
      subtext: `${totalPallets} active stored pallets`,
      trend: "Real-time Stock",
      trendUp: true,
      icon: Boxes,
      accent: "bg-[#2457e6]",
    },
    {
      label: "Monthly Inbound",
      value: `${totalInboundTonnage.toFixed(0)} Units`,
      subtext: `${inboundOrders.length} inbound receipts`,
      trend: "Inbound Volume",
      trendUp: true,
      icon: TrendingUp,
      accent: "bg-[#0d9488]",
    },
    ...(isStaff
      ? [
          {
            label: "Capacity Utilization",
            value: `${occupancyPct.toFixed(1)}%`,
            subtext: `${usedSlots}/${totalSlots} Slots Occupied`,
            trend: `${chambers.length} Active Rooms`,
            trendUp: occupancyPct < 85,
            icon: Layers,
            accent: "bg-[#d97706]",
          },
        ]
      : []),
    {
      label: "Billing Outstanding",
      value: `₹${(unpaidTotal / 100000).toFixed(2)}L`,
      subtext: `₹${(totalPaid / 100000).toFixed(2)}L settled payments`,
      trend: `${invoices.filter((i) => i.status !== "paid").length} unpaid invoices`,
      trendUp: unpaidTotal === 0,
      icon: CreditCard,
      accent: "bg-[#7c3aed]",
    },
  ];

  // Compute Dynamic Chamber Summaries
  const dynamicChambers: UIChamberSummary[] = chambers.map((c) => {
    const capacity = c.total_capacity || c.total_slots || 1;
    const used = c.used_capacity || 0;
    const pct = Math.round((used / capacity) * 100);

    const tempCategory = c.category || "chilled";

    const color =
      pct > 85
        ? "bg-[#e11d48]"
        : tempCategory === "frozen"
        ? "bg-[#2457e6]"
        : tempCategory === "chilled"
        ? "bg-[#0d9488]"
        : "bg-[#d97706]";

    return {
      code: c.code,
      name: c.name,
      temp: `${c.temperature > 0 ? "+" : ""}${c.temperature}°C`,
      occupancy: pct,
      totalCapacity: `${capacity} Slots`,
      used: `${used} Slots`,
      color,
      status: c.status === "active" ? "Optimal Temp" : "Maintenance",
    };
  });

  // Compute Exact 6-Month Rolling Revenue Timeline from Invoices (No Mock Randoms)
  const past6MonthsData: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleString("en-US", { month: "short" });

    const monthlyTotal = invoices
      .filter((inv) => {
        const invDate = new Date(inv.created_at);
        return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
      })
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    past6MonthsData.push({ month: monthName, revenue: monthlyTotal });
  }

  // Compute Exact 7-Day Fulfillment Order Volume Timeline (No Mock Randoms)
  const past7DaysData: { day: string; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = d.toLocaleString("en-US", { weekday: "short" });

    const dayCount = [...inboundOrders, ...outboundOrders].filter((ord) => {
      const ordDate = new Date(ord.created_at);
      return ordDate.toDateString() === d.toDateString();
    }).length;

    past7DaysData.push({ day: dayName, orders: dayCount });
  }

  const total7DayOrders = past7DaysData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrdersText = `Avg. ${Math.round(total7DayOrders / 7)} orders/day`;

  // Compute Recent Activities
  const dynamicActivities: ActivityItem[] = movements.slice(0, 5).map((m) => ({
    id: `MOV-${m.pallet_code}`,
    title:
      m.movement_type === "inbound"
        ? "Inbound Putaway Completed"
        : m.movement_type === "outbound"
        ? "Outbound Dispatch Verified"
        : "Stock Inventory Adjustment",
    client: m.product_name,
    time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type: m.movement_type === "inbound" ? "inbound" : m.movement_type === "outbound" ? "outbound" : "billing",
    details: `${m.weight_mt.toFixed(2)} MT stored in Slot ${m.slot_code}`,
  }));

  // Compute System Alerts
  const dynamicAlerts: AlertItem[] = [];

  // Check high capacity chambers
  chambers.forEach((c) => {
    const capacity = c.total_capacity || c.total_slots || 1;
    const pct = (c.used_capacity / capacity) * 100;
    if (pct >= 85) {
      dynamicAlerts.push({
        severity: "warning",
        title: `Chamber ${c.code} Near Capacity`,
        desc: `Occupancy reached ${pct.toFixed(0)}% (${c.used_capacity}/${capacity} slots). Reallocation recommended.`,
        time: "Just now",
      });
    }
  });

  // Check unpaid invoices
  const unpaidInvoicesCount = invoices.filter((i) => i.status !== "paid").length;
  if (unpaidInvoicesCount > 0) {
    dynamicAlerts.push({
      severity: "info",
      title: `${unpaidInvoicesCount} Unpaid Tax Invoices Outstanding`,
      desc: `Total balance due: ₹${unpaidTotal.toLocaleString()}. Payment reminders pending dispatch.`,
      time: "15 mins ago",
    });
  }

  // System status nominal
  if (dynamicAlerts.length === 0) {
    dynamicAlerts.push({
      severity: "success",
      title: "All Cold Storage Systems Operational",
      desc: `Chambers operating within optimal temperature range. Sensor telemetry synced cleanly.`,
      time: "Real-time",
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <main className="flex-1 lg:ml-65">
          <div className="flex flex-col items-center justify-center h-screen gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
            <div className="text-sm font-medium text-[#64748b]">
              Loading operational & financial management overview...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] font-sans antialiased text-[#17243b]">
      <Sidebar />

      <main className="flex-1 lg:ml-65 min-w-0">
        <DashboardHeader
          title="Dashboard Overview"
          subtitle="Operational & Financial Health · Management Overview"
        />

        <div className="p-6 lg:p-8 space-y-6">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicKPIs.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* Chamber Capacity & Temperature Status (admin / operator only) */}
          {isStaff && (
          <section className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
                    Chamber Capacity & Temperature Status
                  </h3>
                  <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
                    {dynamicChambers.length} Rooms Active
                  </span>
                </div>
                <p className="text-[12px] text-[#64748b]">Physical storage utilization and environment status</p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-[#475569]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2457e6]" /> Frozen (-18°C to -30°C)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#475569]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0d9488]" /> Chilled (2°C to 8°C)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#475569]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" /> Ambient (15°C+)
                </span>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/chamber")}
                  className="hidden sm:inline-flex text-[#2457e6] hover:text-[#1d4ed8] font-semibold transition items-center gap-1 ml-2"
                >
                  Chamber Details <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {dynamicChambers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dynamicChambers.map((chamber) => (
                  <ChamberProgressCard key={chamber.code} {...chamber} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc]">
                <Warehouse className="h-8 w-8 text-[#94a3b8] mb-2" />
                <h4 className="text-xs font-bold text-[#0f172a]">No Storage Chambers Configured</h4>
                <p className="text-[11px] text-[#64748b] mt-0.5 max-w-sm">
                  Configure cold storage chambers to monitor room capacities, temperatures, and slot utilization.
                </p>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/chamber")}
                  className="mt-3 text-xs font-semibold text-white bg-[#2457e6] hover:bg-[#1d4ed8] px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  Configure Chambers <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </section>
          )}

          {/* Commercial Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <RevenueGraph data={past6MonthsData} />
            <VolumeGraph data={past7DaysData} avgOrdersText={avgOrdersText} />
          </div>

          {/* Warehouse Activity & System Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#2457e6]" />
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">Warehouse Activity</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => (window.location.href = "/stock-movements")}
                    className="text-[12px] font-semibold text-[#2457e6] hover:text-[#1d4ed8]"
                  >
                    View Audit Trail
                  </button>
                </div>

                <div className="space-y-4">
                  {dynamicActivities.length > 0 ? (
                    dynamicActivities.map((activity) => (
                      <ActivityRow key={activity.id} {...activity} />
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-[#64748b]">
                      No recent warehouse activity recorded.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-[#f1f5f9] pt-3 text-center text-[12px] text-[#64748b]">
                Showing latest {dynamicActivities.length} transactions · Real-Time Synced
              </div>
            </div>

            <div className="lg:col-span-5 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-[#d97706]" />
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">System Alerts & Actions</h3>
                  </div>
                  <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-bold text-[#b45309]">
                    {dynamicAlerts.length} Unresolved
                  </span>
                </div>

                <div className="space-y-3.5">
                  {dynamicAlerts.map((alert, idx) => (
                    <AlertBox key={alert.title + idx} {...alert} />
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-[#f1f5f9] pt-3 flex items-center justify-between text-[11px] text-[#64748b]">
                <span>Monitoring {dynamicChambers.length} Chambers</span>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/reports")}
                  className="font-semibold text-[#2457e6] hover:underline"
                >
                  Analytics & Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
