import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  get_stock_levels,
  get_stock_levels_by_client,
  get_stock_movements,
  get_stock_movements_by_client,
} from "@/lib/api/stock_movement";
import { get_clients } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import {
  dateInRange,
  DateRangeFilter,
  EMPTY_DATE_RANGE,
  type DateRange,
} from "@/components/shared/date_range_filter";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  History,
  Layers,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Weight,
} from "lucide-react";
import type {
  MovementType,
  StockLevelResponse,
  StockMovementResponse,
  TemperatureCategory,
} from "@/types/stock_movement";
import type { ClientResponse } from "@/types/client";

export function StockMovements() {
  const [activeTab, setActiveTab] = useState<"levels" | "movements">("levels");
  const [stockLevels, setStockLevels] = useState<StockLevelResponse[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<ClientResponse[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [movementFilter, setMovementFilter] = useState<string>("all");
  const [tempFilter, setTempFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [movementRange, setMovementRange] = useState<DateRange>(EMPTY_DATE_RANGE);

  // Client list is admin-only; operators/clients simply get no filter
  useEffect(() => {
    let cancelled = false;
    get_clients()
      .then((data) => {
        if (!cancelled) setClients(data);
      })
      .catch(() => {
        if (!cancelled) setClients([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [levelsData, movementsData] =
        selectedClient === "all"
          ? await Promise.all([get_stock_levels(), get_stock_movements()])
          : await Promise.all([
              get_stock_levels_by_client(selectedClient),
              get_stock_movements_by_client(selectedClient),
            ]);
      setStockLevels(levelsData);
      setStockMovements(movementsData);
    } catch (error) {
      console.error("Failed to load stock movements data:", error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [selectedClient]);

  // Stats
  const totalStockSlots = stockLevels.length;
  const totalWeightMt = stockLevels.reduce((sum, lvl) => sum + (lvl.weight_mt || 0), 0);
  const inboundCount = stockMovements.filter((m) => m.movement_type === "inbound").length;
  const outboundCount = stockMovements.filter((m) => m.movement_type === "outbound").length;

  // Filtered Levels
  const filteredLevels = stockLevels.filter((lvl) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      lvl.product_name.toLowerCase().includes(term) ||
      lvl.pallet_code.toLowerCase().includes(term) ||
      lvl.slot_code.toLowerCase().includes(term) ||
      lvl.batch_code.toLowerCase().includes(term) ||
      (lvl.chamber_code && lvl.chamber_code.toLowerCase().includes(term));

    const matchesTemp = tempFilter === "all" || lvl.temperature_category === tempFilter;

    return matchesSearch && matchesTemp;
  });

  // Filtered Movements
  const filteredMovements = stockMovements.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      m.product_name.toLowerCase().includes(term) ||
      m.pallet_code.toLowerCase().includes(term) ||
      m.slot_code.toLowerCase().includes(term) ||
      m.batch_code.toLowerCase().includes(term);

    const matchesMovement = movementFilter === "all" || m.movement_type === movementFilter;
    const matchesTemp = tempFilter === "all" || m.temperature_category === tempFilter;
    const matchesDate = dateInRange(m.created_at, movementRange);

    return matchesSearch && matchesMovement && matchesTemp && matchesDate;
  });

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case "inbound":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ArrowDownLeft className="h-3 w-3" /> Inbound Putaway
          </span>
        );
      case "outbound":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <ArrowUpRight className="h-3 w-3" /> Outbound Dispatch
          </span>
        );
      case "adjustment":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <RefreshCw className="h-3 w-3" /> Stock Adjustment
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 capitalize">{type}</span>;
    }
  };

  const getTempCategoryBadge = (cat: TemperatureCategory) => {
    switch (cat) {
      case "deep_freeze":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            Deep Freeze (-18°C)
          </span>
        );
      case "chilled":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Chilled (+4°C)
          </span>
        );
      case "ambient":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Ambient
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-500">{cat}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <main className="flex-1 lg:ml-65">
          <div className="flex flex-col items-center justify-center h-screen gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
            <div className="text-sm font-medium text-[#64748b]">
              Loading stock balances & movement audit log...
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
          title="Stock Movements & Audit Log"
          subtitle="Real-time slot-level stock balances and audit log of putaways, dispatches, and inventory movements"
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void fetchData()}
              className="text-xs font-semibold border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#2457e6]" /> Refresh Audit Log
            </Button>
          }
        />

        <div className="p-6 lg:p-8 space-y-6">
          {/* Stats KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#2457e6] flex items-center justify-center">
                <Layers className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Active Occupied Slots</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">{totalStockSlots}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Weight className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Total Stock Volume</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">
                  {totalWeightMt.toFixed(2)} <span className="text-xs font-normal text-[#64748b]">MT</span>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Total Inbound Putaways</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">{inboundCount}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ArrowUpRight className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748b] block">Total Outbound Dispatches</span>
                <span className="text-xl font-bold text-[#0f172a] font-display">{outboundCount}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#e2e8f0] gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("levels")}
              className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === "levels"
                  ? "border-[#2457e6] text-[#2457e6]"
                  : "border-transparent text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              <Boxes className="h-4 w-4" /> Real-Time Stock Balances ({stockLevels.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("movements")}
              className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === "movements"
                  ? "border-[#2457e6] text-[#2457e6]"
                  : "border-transparent text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              <History className="h-4 w-4" /> Movement Audit Trail ({stockMovements.length})
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl border border-[#e2e8f0] bg-white shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                <Input
                  placeholder="Search product, pallet code, slot, batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs bg-[#f8fafc] border-[#e2e8f0]"
                />
              </div>

              {clients.length > 0 && (
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] font-medium text-[#0f172a]"
                >
                  <option value="all">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {activeTab === "movements" && (
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#64748b]" />
                  <select
                    value={movementFilter}
                    onChange={(e) => setMovementFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] font-medium text-[#0f172a]"
                  >
                    <option value="all">All Movement Types</option>
                    <option value="inbound">Inbound Putaway</option>
                    <option value="outbound">Outbound Dispatch</option>
                    <option value="adjustment">Stock Adjustment</option>
                  </select>
                </div>
              )}

              {activeTab === "movements" && (
                <DateRangeFilter
                  label="Movement Date"
                  value={movementRange}
                  onChange={setMovementRange}
                />
              )}

              <select
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] font-medium text-[#0f172a]"
              >
                <option value="all">All Temperature Zones</option>
                <option value="deep_freeze">Deep Freeze (-18°C)</option>
                <option value="chilled">Chilled (+4°C)</option>
                <option value="ambient">Ambient</option>
              </select>
            </div>
          </div>

          {/* Tab Content 1: Stock Levels */}
          {activeTab === "levels" && (
            <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
              {filteredLevels.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#64748b]">
                  No active stock level records match your search query.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#f8fafc]">
                    <TableRow className="border-b border-[#e2e8f0]">
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 pl-6">
                        Pallet / Batch
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5">
                        Product Description
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5">
                        Chamber & Slot
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5">
                        Temp Zone
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 text-right">
                        Units / Quantity
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 text-right pr-6">
                        Weight (MT)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-[#e2e8f0]">
                    {filteredLevels.map((lvl) => (
                      <TableRow key={lvl.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                        <TableCell className="py-4 pl-6">
                          <div className="font-mono text-xs font-bold text-[#2457e6]">
                            {lvl.pallet_code}
                          </div>
                          <div className="text-[10px] text-[#64748b] font-mono">
                            Batch: {lvl.batch_code}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 font-semibold text-xs text-[#0f172a]">
                          {lvl.product_name}
                        </TableCell>

                        <TableCell className="py-4 text-xs">
                          <span className="font-bold text-[#0f172a]">{lvl.chamber_code}</span> ·{" "}
                          <span className="font-mono text-[#2457e6]">{lvl.slot_code}</span>
                        </TableCell>

                        <TableCell className="py-4">
                          {getTempCategoryBadge(lvl.temperature_category)}
                        </TableCell>

                        <TableCell className="py-4 text-right font-bold text-xs text-[#0f172a]">
                          {lvl.quantity.toLocaleString()}
                        </TableCell>

                        <TableCell className="py-4 text-right pr-6 font-bold text-xs text-[#0f172a]">
                          {lvl.weight_mt.toFixed(2)} MT
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* Tab Content 2: Movement Audit Log */}
          {activeTab === "movements" && (
            <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
              {filteredMovements.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#64748b]">
                  No movement audit logs recorded matching your filter parameters.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#f8fafc]">
                    <TableRow className="border-b border-[#e2e8f0]">
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 pl-6">
                        Timestamp / Movement Type
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5">
                        Pallet / Batch
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5">
                        Product Name
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5">
                        Location / Slot
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 text-right">
                        Quantity
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-[#64748b] py-3.5 text-right pr-6">
                        Weight (MT)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-[#e2e8f0]">
                    {filteredMovements.map((m) => (
                      <TableRow key={m.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                        <TableCell className="py-4 pl-6">
                          <div className="mb-1">{getMovementBadge(m.movement_type)}</div>
                          <div className="text-[10px] text-[#64748b]">
                            {new Date(m.created_at).toLocaleString()}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 font-mono text-xs">
                          <div className="font-bold text-[#0f172a]">{m.pallet_code}</div>
                          <div className="text-[10px] text-[#64748b]">Batch: {m.batch_code}</div>
                        </TableCell>

                        <TableCell className="py-4 font-semibold text-xs text-[#0f172a]">
                          {m.product_name}
                        </TableCell>

                        <TableCell className="py-4 text-xs font-mono font-bold text-[#2457e6]">
                          {m.slot_code}
                        </TableCell>

                        <TableCell className="py-4 text-right font-bold text-xs text-[#0f172a]">
                          {m.quantity.toLocaleString()}
                        </TableCell>

                        <TableCell className="py-4 text-right pr-6 font-bold text-xs text-[#0f172a]">
                          {m.weight_mt.toFixed(2)} MT
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
