import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { get_invoices } from "@/lib/api/invoice";
import { get_payments } from "@/lib/api/payment";
import { get_stock_levels } from "@/lib/api/stock_movement";
import { get_inbound_orders } from "@/lib/api/order";
import { get_outbound_orders } from "@/lib/api/outbound";
import { get_chambers } from "@/lib/api/chamber";
import { get_clients } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { settledValue } from "@/utils/async";
import {
  Boxes,
  Building2,
  CreditCard,
  Layers,
  Printer,
  RefreshCw,
  TrendingUp,
  Weight,
} from "lucide-react";
import type { InvoiceDetailResponse } from "@/types/invoice";
import type { PaymentDetailResponse } from "@/types/payment";
import type { StockLevelResponse } from "@/types/stock_movement";
import type { InboundOrderResponse } from "@/types/order";
import type { OutboundOrderResponse } from "@/types/outbound";
import type { ChamberSummary } from "@/types/chamber";
import type { ClientResponse } from "@/types/client";

export function Reports() {
  const [invoices, setInvoices] = useState<InvoiceDetailResponse[]>([]);
  const [payments, setPayments] = useState<PaymentDetailResponse[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelResponse[]>([]);
  const [inboundOrders, setInboundOrders] = useState<InboundOrderResponse[]>([]);
  const [outboundOrders, setOutboundOrders] = useState<OutboundOrderResponse[]>([]);
  const [chambers, setChambers] = useState<ChamberSummary[]>([]);
  const [clients, setClients] = useState<ClientResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<"all" | "30days" | "90days">("all");

  const loadAllData = async () => {
    setIsLoading(true);
    const requests: [
      Promise<InvoiceDetailResponse[]>,
      Promise<PaymentDetailResponse[]>,
      Promise<StockLevelResponse[]>,
      Promise<InboundOrderResponse[]>,
      Promise<OutboundOrderResponse[]>,
      Promise<ChamberSummary[]>,
      Promise<ClientResponse[]>,
    ] = [
      get_invoices(),
      get_payments(),
      get_stock_levels(),
      get_inbound_orders(),
      get_outbound_orders(),
      get_chambers(),
      get_clients(),
    ];

    const results = await Promise.allSettled(requests);
    const [
      invoiceRes,
      paymentRes,
      stockRes,
      inboundRes,
      outboundRes,
      chamberRes,
      clientRes,
    ] = results;

    setInvoices(settledValue(invoiceRes, []));
    setPayments(settledValue(paymentRes, []));
    setStockLevels(settledValue(stockRes, []));
    setInboundOrders(settledValue(inboundRes, []));
    setOutboundOrders(settledValue(outboundRes, []));
    setChambers(settledValue(chamberRes, []));
    setClients(settledValue(clientRes, []));

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const firstFailure = failed[0];
    if (firstFailure) {
      console.error(
        "Failed to load some reports analytics data:",
        failed.map((f) => f.reason),
      );
      toast.error(getApiErrorMessage(firstFailure.reason));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadAllData();
  }, []);

  // Filter calculations based on time period
  const filterByDate = (dateStr: string) => {
    if (timePeriod === "all") return true;
    const date = new Date(dateStr).getTime();
    const now = Date.now();
    const days = timePeriod === "30days" ? 30 : 90;
    return now - date <= days * 24 * 60 * 60 * 1000;
  };

  const filteredInvoices = invoices.filter((i) => filterByDate(i.created_at));
  const filteredPayments = payments.filter((p) => filterByDate(p.created_at));
  const filteredInbound = inboundOrders.filter((o) => filterByDate(o.created_at));
  const filteredOutbound = outboundOrders.filter((o) => filterByDate(o.created_at));

  // Executive KPI Calculations
  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = filteredPayments
    .filter((p) => p.status === "captured")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 100;

  const totalStockWeight = stockLevels.reduce((sum, lvl) => sum + (lvl.weight_mt || 0), 0);
  const totalPallets = stockLevels.length;

  const totalSlotsAcrossChambers = chambers.reduce((sum, c) => sum + (c.total_capacity || c.total_slots || 0), 0);
  const occupiedSlotsAcrossChambers = chambers.reduce((sum, c) => sum + (c.used_capacity || 0), 0);
  const occupancyPercent =
    totalSlotsAcrossChambers > 0
      ? (occupiedSlotsAcrossChambers / totalSlotsAcrossChambers) * 100
      : 0;

  const totalLogisticsOrders = filteredInbound.length + filteredOutbound.length;

  // Recharts Data Aggregation

  // 1. Revenue & Payment Velocity Chart Data
  const financialChartData = [
    { name: "Invoiced Total", amount: totalInvoiced, fill: "#2457e6" },
    { name: "Collected Paid", amount: totalPaid, fill: "#10b981" },
    { name: "Outstanding Due", amount: Math.max(0, totalInvoiced - totalPaid), fill: "#f59e0b" },
  ];

  // 2. Stock Weight by Temperature Category
  const tempZoneMap: Record<string, { weight: number; count: number }> = {
    deep_freeze: { weight: 0, count: 0 },
    chilled: { weight: 0, count: 0 },
    ambient: { weight: 0, count: 0 },
  };

  stockLevels.forEach((lvl) => {
    const cat = lvl.temperature_category || "ambient";
    if (!tempZoneMap[cat]) tempZoneMap[cat] = { weight: 0, count: 0 };
    tempZoneMap[cat].weight += lvl.weight_mt || 0;
    tempZoneMap[cat].count += 1;
  });

  const tempCategoryChartData = [
    {
      category: "Deep Freeze (-18°C)",
      weight: parseFloat((tempZoneMap.deep_freeze?.weight || 0).toFixed(2)),
      pallets: tempZoneMap.deep_freeze?.count || 0,
      color: "#06b6d4",
    },
    {
      category: "Chilled (+4°C)",
      weight: parseFloat((tempZoneMap.chilled?.weight || 0).toFixed(2)),
      pallets: tempZoneMap.chilled?.count || 0,
      color: "#10b981",
    },
    {
      category: "Ambient",
      weight: parseFloat((tempZoneMap.ambient?.weight || 0).toFixed(2)),
      pallets: tempZoneMap.ambient?.count || 0,
      color: "#64748b",
    },
  ];

  // 3. Inbound vs Outbound Order Distribution
  const orderThroughputData = [
    {
      name: "Inbound Receivings",
      total: filteredInbound.length,
      completed: filteredInbound.filter((o) => o.status === "stored" || o.status === "arrived").length,
    },
    {
      name: "Outbound Dispatches",
      total: filteredOutbound.length,
      completed: filteredOutbound.filter((o) => o.status === "dispatched").length,
    },
  ];

  // 4. Client Storage Distribution Data
  const clientStorageMatrix = clients.map((client) => {
    const clientInvoices = invoices.filter((i) => i.client_id === client.id);
    const clientInvoicedTotal = clientInvoices.reduce((sum, i) => sum + i.total_amount, 0);
    const clientPaidTotal = clientInvoices.reduce((sum, i) => sum + i.amount_paid, 0);

    return {
      id: client.id,
      name: client.name,
      gstin: client.gstin || "URP",
      email: client.email,
      phone: client.phone_number,
      invoicesCount: clientInvoices.length,
      totalInvoiced: clientInvoicedTotal,
      totalPaid: clientPaidTotal,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <main className="flex-1 lg:ml-65">
          <div className="flex flex-col items-center justify-center h-screen gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
            <div className="text-sm font-medium text-[#64748b]">
              Generating operational & financial analytics reports...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] font-sans antialiased text-[#17243b]">
      <Sidebar />
      <main className="flex-1 lg:ml-65 min-w-0 print:m-0 print:p-0">
        <DashboardHeader
          title="Reports & Analytics"
          subtitle="Comprehensive operational throughput, inventory occupancy, billing revenue, and compliance metrics"
          actions={
            <div className="flex items-center gap-2 print:hidden">
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as "all" | "30days" | "90days")}
                className="px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-xl bg-white font-medium text-[#0f172a]"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadAllData()}
                className="text-xs font-semibold border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#2457e6]" /> Refresh
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-3 flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print Report
              </Button>
            </div>
          }
        />

        <div className="p-6 lg:p-8 space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Total Invoiced Revenue</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">
                  ₹{totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  Collection Rate: {collectionRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#2457e6] flex items-center justify-center">
                <Weight className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Stock Volume Stored</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">
                  {totalStockWeight.toFixed(2)} <span className="text-xs font-normal text-[#64748b]">MT</span>
                </span>
                <span className="text-[10px] text-[#64748b] font-semibold block mt-0.5">
                  Across {totalPallets} Active Pallets
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Warehouse Occupancy</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">
                  {occupancyPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#64748b] font-semibold block mt-0.5">
                  {occupiedSlotsAcrossChambers} of {totalSlotsAcrossChambers} Slots Filled
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Logistics Order Volume</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">{totalLogisticsOrders}</span>
                <span className="text-[10px] text-[#64748b] font-semibold block mt-0.5">
                  {filteredInbound.length} Inbound · {filteredOutbound.length} Outbound
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Performance Chart */}
            <div className="p-5 rounded-2xl border border-[#e2e8f0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#2457e6]" /> Financial Collection Summary
                  </h3>
                  <p className="text-[11px] text-[#64748b]">Billed invoices vs settled payment amounts</p>
                </div>
                <div className="text-right text-xs font-bold text-emerald-600">
                  Paid: ₹{totalPaid.toLocaleString()}
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickFormatter={(val) => `₹${(Number(val) / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val) => [`₹${Number(val || 0).toLocaleString()}`, "Amount"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {financialChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Temperature Zone Tonnage Chart */}
            <div className="p-5 rounded-2xl border border-[#e2e8f0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-cyan-600" /> Storage Volume by Temperature Zone
                  </h3>
                  <p className="text-[11px] text-[#64748b]">Metric tons stored across cold chain categories</p>
                </div>
                <div className="text-right text-xs font-bold text-[#0f172a]">
                  Total: {totalStockWeight.toFixed(2)} MT
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tempCategoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} unit=" MT" />
                    <Tooltip
                      formatter={(val) => [`${Number(val || 0)} MT`, "Weight Stored"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Bar dataKey="weight" radius={[8, 8, 0, 0]}>
                      {tempCategoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inbound vs Outbound Order Throughput */}
            <div className="p-5 rounded-2xl border border-[#e2e8f0] bg-white shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Order Throughput & Completion
                </h3>
                <p className="text-[11px] text-[#64748b]">Inbound receivings vs outbound dispatch completions</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderThroughputData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                    <Bar dataKey="total" name="Total Requested" fill="#2457e6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completed" name="Fully Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chamber Occupancy Breakdown */}
            <div className="p-5 rounded-2xl border border-[#e2e8f0] bg-white shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" /> Chamber Facility Occupancy Matrix
                </h3>
                <p className="text-[11px] text-[#64748b]">Occupied vs capacity slots across warehouse chambers</p>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-[#f8fafc]">
                    <TableRow className="border-b border-[#e2e8f0]">
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-2.5 pl-4">Chamber</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-2.5">Category</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-2.5 text-right">Occupied / Total</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-2.5 text-right pr-4">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-[#e2e8f0]">
                    {chambers.map((c) => {
                      const capacity = c.total_capacity || c.total_slots || 0;
                      const occupied = c.used_capacity || 0;
                      const util = capacity > 0 ? (occupied / capacity) * 100 : 0;
                      return (
                        <TableRow key={c.id} className="hover:bg-[#f8fafc]">
                          <TableCell className="py-2.5 pl-4 text-xs font-bold text-[#0f172a]">{c.name}</TableCell>
                          <TableCell className="py-2.5 text-[11px] capitalize text-[#64748b]">{c.category}</TableCell>
                          <TableCell className="py-2.5 text-right text-xs font-mono">
                            {occupied} / {capacity}
                          </TableCell>
                          <TableCell className="py-2.5 text-right pr-4 text-xs font-bold text-[#2457e6]">
                            {util.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Client Master Storage Matrix Table */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0]">
              <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#2457e6]" /> Client Organization Storage & Financial Breakdown
              </h3>
              <p className="text-[11px] text-[#64748b]">Summary of billing statements, invoice volume, and settlement rates per client</p>
            </div>

            <Table>
              <TableHeader className="bg-[#f8fafc]">
                <TableRow className="border-b border-[#e2e8f0]">
                  <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 pl-6">Client Organization</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5">GSTIN / Contact Email</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 text-right">Invoices</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 text-right">Billed Amount</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 text-right pr-6">Amount Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#e2e8f0]">
                {clientStorageMatrix.map((c) => (
                  <TableRow key={c.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="font-bold text-xs text-[#0f172a]">{c.name}</div>
                    </TableCell>
                    <TableCell className="py-4 text-xs">
                      <div className="font-mono text-[11px] text-[#2457e6]">GSTIN: {c.gstin}</div>
                      <div className="text-[10px] text-[#64748b]">{c.email}</div>
                    </TableCell>
                    <TableCell className="py-4 text-right text-xs font-semibold text-[#0f172a]">
                      {c.invoicesCount} Invoices
                    </TableCell>
                    <TableCell className="py-4 text-right text-xs font-bold text-[#0f172a]">
                      ₹{c.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6 text-xs font-bold text-emerald-600">
                      ₹{c.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
