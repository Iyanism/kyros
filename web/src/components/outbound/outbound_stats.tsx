import type { OutboundOrderResponse } from "@/types/outbound";
import { Truck, Clock, CheckCircle2, PackageCheck } from "lucide-react";

interface OutboundStatsProps {
  orders: OutboundOrderResponse[];
}

export function OutboundStats({ orders }: OutboundStatsProps) {
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "submitted").length;
  const approved = orders.filter((o) => o.status === "approved").length;
  const dispatched = orders.filter((o) => o.status === "dispatched").length;
  const totalQuantity = orders.reduce((sum, o) => sum + (o.total_quantity || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Outbound */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Total Outbound Manifests
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {total}
          </p>
          <span className="text-[11px] font-medium text-[#2457e6] mt-0.5 block">
            Dispatch Orders Logged
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
          <Truck className="h-5 w-5" />
        </div>
      </div>

      {/* Pending Approval */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Pending Approval
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {pending}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
            Awaiting Admin Review
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5" />
        </div>
      </div>

      {/* Approved / In-Process */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Approved / Dispatched
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {approved + dispatched}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {dispatched} Dispatched, {approved} Approved
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>

      {/* Total Outbound Mass */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Total Dispatch Units
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {totalQuantity.toLocaleString()}{" "}
            <span className="text-xs font-normal text-[#64748b]">units</span>
          </p>
          <span className="text-[11px] text-[#64748b] mt-0.5 block">
            Total Outbound Quantity
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <PackageCheck className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
