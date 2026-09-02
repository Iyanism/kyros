import type { InboundOrderResponse } from "@/types/order";
import { Package, Clock, CheckCircle2, Scale } from "lucide-react";
import { calculateTotalWeightInKg } from "./inbound_items_list";

export function InboundStats({ orders }: { orders: InboundOrderResponse[] }) {
  const totalOrders = orders.length;
  const storedOrReceived = orders.filter((o) => o.status === "stored" || o.status === "received").length;
  const pendingOrInspecting = orders.filter((o) => o.status === "pending" || o.status === "inspecting").length;

  const totalQuantitySum = orders.reduce((acc, o) => acc + (o.total_quantity || 0), 0);
  const totalWeightKgSum = orders.reduce((acc, o) => acc + calculateTotalWeightInKg(o.items), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Orders */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#64748b]">Total Inbound Orders</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2457e6]/10 text-[#2457e6]">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#0f172a]">{totalOrders}</span>
          <span className="text-[11px] font-medium text-[#64748b]">shipments logged</span>
        </div>
      </div>

      {/* Stored / Received */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#64748b]">Stored & Received</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16a34a]/10 text-[#16a34a]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#0f172a]">{storedOrReceived}</span>
          <span className="text-[11px] font-medium text-[#16a34a]">verified intake</span>
        </div>
      </div>

      {/* Pending / Inspecting */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#64748b]">Pending & Inspecting</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d97706]/10 text-[#d97706]">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#0f172a]">{pendingOrInspecting}</span>
          <span className="text-[11px] font-medium text-[#d97706]">awaiting complete intake</span>
        </div>
      </div>

      {/* Total Weight / Quantity */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#64748b]">Total Inbound Volume</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2457e6]/10 text-[#2457e6]">
            <Scale className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-[#0f172a]">
            {totalQuantitySum.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium text-[#64748b]">
            units (~{(totalWeightKgSum / 1000).toFixed(1)} MT)
          </span>
        </div>
      </div>
    </div>
  );
}
