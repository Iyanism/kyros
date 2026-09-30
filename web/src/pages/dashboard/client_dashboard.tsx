import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Boxes,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
} from "lucide-react";
import { ActivityRow } from "@/components/dashboard/activity";
import { AlertBox } from "@/components/dashboard/alert_log";
import { ClientExpiryList } from "@/components/dashboard/client_expiry_list";
import {
  ClientOrdersList,
  type ClientOrderRow,
} from "@/components/dashboard/client_orders_list";
import { KpiCard } from "@/components/dashboard/kpi";
import { RevenueGraph } from "@/components/dashboard/revenue_graph";
import { VolumeGraph } from "@/components/dashboard/volume_graph";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { get_client_inventory_summary } from "@/lib/api/inventory";
import { get_inbound_orders } from "@/lib/api/order";
import { get_invoices } from "@/lib/api/invoice";
import { get_outbound_orders } from "@/lib/api/outbound";
import { get_payments } from "@/lib/api/payment";
import { get_stock_levels, get_stock_movements } from "@/lib/api/stock_movement";
import { useAuth } from "@/hooks/useAuth";
import { settledValue } from "@/utils/async";
import type { ClientInventorySummary } from "@/types/inventory";
import type { InboundOrderResponse, OrderStatus } from "@/types/order";
import type { InvoiceDetailResponse } from "@/types/invoice";
import type { OutboundOrderResponse, OutboundOrderStatus } from "@/types/outbound";
import type { PaymentDetailResponse } from "@/types/payment";
import type {
  StockLevelResponse,
  StockMovementResponse,
} from "@/types/stock_movement";
import type { ActivityItem, AlertItem, Kpi } from "@/lib/data/dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

const INBOUND_PROCESS = new Set<OrderStatus>([
  "submitted",
  "approved",
  "in_transit",
  "arrived",
  "processing",
]);
const OUTBOUND_PROCESS = new Set<OutboundOrderStatus>([
  "draft",
  "submitted",
  "approved",
]);

function formatINR(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function ClientDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [stockLevels, setStockLevels] = useState<StockLevelResponse[]>([]);
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDetailResponse[]>([]);
  const [payments, setPayments] = useState<PaymentDetailResponse[]>([]);
  const [inboundOrders, setInboundOrders] = useState<InboundOrderResponse[]>([]);
  const [outboundOrders, setOutboundOrders] = useState<OutboundOrderResponse[]>([]);
  const [inventorySummary, setInventorySummary] = useState<ClientInventorySummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      const requests: [
        Promise<StockLevelResponse[]>,
        Promise<StockMovementResponse[]>,
        Promise<InvoiceDetailResponse[]>,
        Promise<PaymentDetailResponse[]>,
        Promise<InboundOrderResponse[]>,
        Promise<OutboundOrderResponse[]>,
        Promise<ClientInventorySummary[]>,
      ] = [
        get_stock_levels(),
        get_stock_movements(),
        get_invoices(),
        get_payments(),
        get_inbound_orders(),
        get_outbound_orders(),
        user?.client_id
          ? get_client_inventory_summary(user.client_id)
          : Promise.resolve<ClientInventorySummary[]>([]),
      ];

      const results = await Promise.allSettled(requests);
      if (cancelled) return;

      const [
        stockRes,
        movementRes,
        invoiceRes,
        paymentRes,
        inboundRes,
        outboundRes,
        summaryRes,
      ] = results;

      setStockLevels(settledValue(stockRes, []));
      setMovements(settledValue(movementRes, []));
      setInvoices(settledValue(invoiceRes, []));
      setPayments(settledValue(paymentRes, []));
      setInboundOrders(settledValue(inboundRes, []));
      setOutboundOrders(settledValue(outboundRes, []));
      setInventorySummary(settledValue(summaryRes, []));

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
  }, [user]);

  const now = Date.now();
  const todayMonth = new Date().getMonth();
  const todayYear = new Date().getFullYear();

  // --- Inventory ---
  const totalStockWeight = stockLevels.reduce((sum, lvl) => sum + (lvl.weight_mt || 0), 0);
  const totalPallets = stockLevels.length;

  // --- Orders ---
  const inboundInProcess = inboundOrders.filter((o) => INBOUND_PROCESS.has(o.status));
  const outboundInProcess = outboundOrders.filter((o) => OUTBOUND_PROCESS.has(o.status));
  const inboundCompleted = inboundOrders.filter((o) => o.status === "stored");
  const outboundCompleted = outboundOrders.filter((o) => o.status === "dispatched");
  const inboundRejected = inboundOrders.filter((o) => o.status === "rejected");
  const outboundRejected = outboundOrders.filter((o) => o.status === "rejected");
  const rejectedTotal = inboundRejected.length + outboundRejected.length;
  const completedTotal = inboundCompleted.length + outboundCompleted.length;

  // --- Billing ---
  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");
  const outstanding = unpaidInvoices.reduce(
    (sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.amount_paid || 0)),
    0,
  );
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const settledTotal = payments
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const nearestDue = unpaidInvoices
    .map((i) => i.due_date)
    .filter(Boolean)
    .sort()[0];
  const thisMonthInvoiced = invoices
    .filter((inv) => {
      const d = new Date(inv.created_at);
      return d.getMonth() === todayMonth && d.getFullYear() === todayYear;
    })
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  // --- Near expiry ---
  const flaggedBatches = inventorySummary
    .map((batch) => ({
      ...batch,
      daysLeft: Math.ceil((new Date(batch.expiry_date).getTime() - now) / DAY_MS),
    }))
    .filter((batch) => batch.daysLeft <= 14)
    .sort((a, b) => b.daysLeft - a.daysLeft);
  const expiredBatches = flaggedBatches.filter((b) => b.daysLeft <= 0);
  const expiringBatches = flaggedBatches.filter((b) => b.daysLeft > 0);
  const flaggedWeight = flaggedBatches.reduce(
    (sum, b) => sum + (b.total_weight_mt || 0),
    0,
  );

  const dynamicKPIs: Kpi[] = [
    {
      label: "Items in Inventory",
      value: `${totalStockWeight.toFixed(1)} MT`,
      subtext: `${totalPallets} active stored pallets`,
      trend: "Real-time stock",
      trendUp: true,
      icon: Boxes,
      accent: "bg-[#2457e6]",
    },
    {
      label: "Inbound In Progress",
      value: `${inboundInProcess.length}`,
      subtext: `${inboundInProcess.reduce((sum, o) => sum + (o.total_quantity || 0), 0).toLocaleString()} units expected`,
      trend: "Awaiting storage",
      trendUp: true,
      icon: ArrowDownToLine,
      accent: "bg-[#0d9488]",
    },
    {
      label: "Outbound In Progress",
      value: `${outboundInProcess.length}`,
      subtext: `${outboundInProcess.reduce((sum, o) => sum + (o.total_quantity || 0), 0).toLocaleString()} units to ship`,
      trend: "Awaiting dispatch",
      trendUp: true,
      icon: ArrowUpFromLine,
      accent: "bg-[#0284c7]",
    },
    {
      label: "Amount Due",
      value: formatINR(outstanding),
      subtext:
        unpaidInvoices.length > 0
          ? `${unpaidInvoices.length} invoice${unpaidInvoices.length > 1 ? "s" : ""} pending`
          : "All invoices settled",
      trend:
        outstanding === 0
          ? "No pending dues"
          : nearestDue
            ? `Due ${new Date(nearestDue).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
            : `${unpaidInvoices.length} unpaid`,
      trendUp: outstanding === 0,
      icon: CreditCard,
      accent: "bg-[#7c3aed]",
    },
    {
      label: "Completed Orders",
      value: `${completedTotal}`,
      subtext: `${inboundCompleted.length} inbound · ${outboundCompleted.length} outbound`,
      trend: "All-time",
      trendUp: true,
      icon: CheckCircle2,
      accent: "bg-[#059669]",
    },
    {
      label: "Rejected Orders",
      value: `${rejectedTotal}`,
      subtext: `${inboundRejected.length} inbound · ${outboundRejected.length} outbound`,
      trend: rejectedTotal > 0 ? "Needs review" : "None rejected",
      trendUp: rejectedTotal === 0,
      icon: XCircle,
      accent: "bg-[#e11d48]",
    },
    {
      label: "Expiring Soon",
      value: `${flaggedBatches.length}`,
      subtext:
        flaggedBatches.length > 0
          ? `${flaggedWeight.toFixed(1)} MT across ${flaggedBatches.length} batches`
          : "No near-expiry stock",
      trend:
        expiredBatches.length > 0
          ? `${expiredBatches.length} already expired`
          : expiringBatches.length > 0
            ? "Next 14 days"
            : "All stock fresh",
      trendUp: flaggedBatches.length === 0,
      icon: Clock,
      accent: "bg-[#d97706]",
    },
    {
      label: "Payments Settled",
      value: formatINR(settledTotal),
      subtext: `${paidInvoices.length} invoice${paidInvoices.length === 1 ? "" : "s"} paid`,
      trend: "All-time settled",
      trendUp: true,
      icon: Banknote,
      accent: "bg-[#0891b2]",
    },
  ];

  // --- 6-month invoiced timeline (their invoices only) ---
  const past6MonthsData: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleString("en-US", { month: "short" });
    const monthlyTotal = invoices
      .filter((inv) => {
        const invDate = new Date(inv.created_at);
        return (
          invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear()
        );
      })
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    past6MonthsData.push({ month: monthName, revenue: monthlyTotal });
  }

  // --- 7-day order volume (their orders only) ---
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

  // --- Recent activity (their movements) ---
  const dynamicActivities: ActivityItem[] = movements.slice(0, 5).map((m) => ({
    id: `MOV-${m.pallet_code}`,
    title:
      m.movement_type === "inbound"
        ? "Inbound Putaway Completed"
        : m.movement_type === "outbound"
          ? "Outbound Dispatch Verified"
          : "Stock Inventory Adjustment",
    client: m.product_name,
    time: new Date(m.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type:
      m.movement_type === "inbound"
        ? "inbound"
        : m.movement_type === "outbound"
          ? "outbound"
          : "billing",
    details: `${m.weight_mt.toFixed(2)} MT stored in Slot ${m.slot_code}`,
  }));

  // --- Recent orders (merged, latest first) ---
  const recentOrderRows: ClientOrderRow[] = [
    ...inboundOrders.map((o) => ({
      id: o.id,
      direction: "inbound" as const,
      quantity: o.total_quantity,
      status: o.status,
      createdAt: o.created_at,
    })),
    ...outboundOrders.map((o) => ({
      id: o.id,
      direction: "outbound" as const,
      quantity: o.total_quantity,
      status: o.status,
      createdAt: o.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // --- Action center (client-relevant only) ---
  const dynamicAlerts: AlertItem[] = [];
  if (expiredBatches.length > 0) {
    dynamicAlerts.push({
      severity: "warning",
      title: `${expiredBatches.length} batch${expiredBatches.length > 1 ? "es have" : " has"} already expired`,
      desc: `${expiredBatches.reduce((sum, b) => sum + (b.total_weight_mt || 0), 0).toFixed(1)} MT of expired stock needs review.`,
      time: "Just now",
    });
  }
  if (expiringBatches.length > 0) {
    const earliest = [...expiringBatches].sort((a, b) => a.daysLeft - b.daysLeft)[0];
    dynamicAlerts.push({
      severity: "warning",
      title: `${expiringBatches.length} batch${expiringBatches.length > 1 ? "es" : ""} expiring within 14 days`,
      desc: earliest
        ? `Soonest: ${earliest.product_name} in ${earliest.daysLeft} day${earliest.daysLeft === 1 ? "" : "s"}.`
        : "Plan dispatch or rotation soon.",
      time: "Just now",
    });
  }
  if (rejectedTotal > 0) {
    dynamicAlerts.push({
      severity: "warning",
      title: `${rejectedTotal} order${rejectedTotal > 1 ? "s were" : " was"} rejected`,
      desc: `${inboundRejected.length} inbound · ${outboundRejected.length} outbound — open the orders pages for details.`,
      time: "Just now",
    });
  }
  if (unpaidInvoices.length > 0) {
    dynamicAlerts.push({
      severity: "info",
      title: `${unpaidInvoices.length} invoice${unpaidInvoices.length > 1 ? "s" : ""} unpaid`,
      desc: `Outstanding balance of ₹${Math.round(outstanding).toLocaleString("en-IN")}${
        nearestDue
          ? `, earliest due ${new Date(nearestDue).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
          : ""
      }.`,
      time: "Just now",
    });
  }
  if (dynamicAlerts.length === 0) {
    dynamicAlerts.push({
      severity: "success",
      title: "You're all caught up",
      desc: "No outstanding dues, expiring stock or rejected orders.",
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
              Loading your inventory, orders and billing...
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
          title="My Dashboard"
          subtitle="Your inventory, orders and billing at a glance"
        />

        <div className="p-6 lg:p-8 space-y-6">
          {/* KPI Summary Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicKPIs.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* My Billing & My Order Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <RevenueGraph
              data={past6MonthsData}
              title="My Billing"
              subtitle="Your invoiced amounts over the last 6 months"
              legendLabel="Amount Invoiced (₹)"
              headerStat={{
                label: "This month",
                value: `${formatINR(thisMonthInvoiced)} invoiced`,
              }}
              footerText={`${formatINR(settledTotal)} settled · ${formatINR(outstanding)} outstanding`}
              showExtras={false}
            />
            <VolumeGraph
              data={past7DaysData}
              title="My Order Volume"
              avgOrdersText={avgOrdersText}
            />
          </div>

          {/* Expiring Soon & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <ClientExpiryList batches={flaggedBatches} />
            <ClientOrdersList orders={recentOrderRows} />
          </div>

          {/* My Recent Activity & Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#2457e6]" />
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
                      My Recent Activity
                    </h3>
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
                      No recent stock activity recorded.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-[#f1f5f9] pt-3 text-center text-[12px] text-[#64748b]">
                Showing latest {dynamicActivities.length} movements · Real-Time Synced
              </div>
            </div>

            <div className="lg:col-span-5 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-[#d97706]" />
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
                      Action Center
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-bold text-[#b45309]">
                    {dynamicAlerts.filter((a) => a.severity !== "success").length} Open
                  </span>
                </div>

                <div className="space-y-3.5">
                  {dynamicAlerts.map((alert, idx) => (
                    <AlertBox key={alert.title + idx} {...alert} />
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-[#f1f5f9] pt-3 flex items-center justify-between text-[11px] text-[#64748b]">
                <span>Updated in real-time</span>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/billing")}
                  className="font-semibold text-[#2457e6] hover:underline"
                >
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
