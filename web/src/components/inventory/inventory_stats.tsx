import type { PalletItemResponse } from "@/types/inventory";
import { Boxes, MapPin, AlertTriangle, Snowflake } from "lucide-react";

interface InventoryStatsProps {
  items: PalletItemResponse[];
}

export function InventoryStats({ items }: InventoryStatsProps) {
  const totalPallets = items.length;
  const totalWeightKg = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalWeightMt = totalWeightKg / 1000;
  
  // Calculate near expiry items (expiring within 14 days)
  const now = new Date();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const nearExpiryCount = items.filter((item) => {
    if (!item.expiry_date) return false;
    const expiry = new Date(item.expiry_date);
    const diff = expiry.getTime() - now.getTime();
    return diff > 0 && diff <= fourteenDaysMs;
  }).length;

  const distinctChambers = new Set(items.map((i) => i.chamber_code).filter(Boolean)).size;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Pallets Stored */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Total Pallets Stored
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {totalPallets.toLocaleString()}
          </p>
          <span className="text-[11px] font-medium text-[#2457e6] mt-0.5 block">
            Occupied Pallet Units
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
          <Boxes className="h-5 w-5" />
        </div>
      </div>

      {/* Total Tonnage Stored */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Total Mass Stored
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {totalWeightMt.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-[#64748b]">MT</span>
          </p>
          <span className="text-[11px] text-[#64748b] mt-0.5 block">
            {totalWeightKg.toLocaleString()} kg total
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
          <Snowflake className="h-5 w-5" />
        </div>
      </div>

      {/* Distinct Storage Zones */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Active Storage Chambers
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {distinctChambers}
          </p>
          <span className="text-[11px] text-[#64748b] mt-0.5 block">
            Chambers In Use
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5" />
        </div>
      </div>

      {/* Near Expiry Alert */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Expiring Soon (&lt; 14 Days)
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            {nearExpiryCount}
          </p>
          <span className={`text-[11px] font-semibold mt-0.5 block ${nearExpiryCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {nearExpiryCount > 0 ? "Requires Rotation / Dispatch" : "All Stock Fresh"}
          </span>
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${nearExpiryCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
