import type { PalletItemResponse } from "@/types/inventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Snowflake, Package, MapPin, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import type { ChamberCategory } from "@/types/chamber";

interface InventoryTableProps {
  items: PalletItemResponse[];
}

const CATEGORY_BADGE_STYLE: Record<ChamberCategory, { bg: string; text: string; label: string }> = {
  ambient: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Ambient (+15°C to +25°C)" },
  chilled: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Chilled (+2°C to +8°C)" },
  frozen: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", label: "Frozen (-18°C to -22°C)" },
};

export function InventoryTable({ items }: InventoryTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-[#cbd5e1] bg-white text-center">
        <div className="h-12 w-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-3 text-[#94a3b8]">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="text-[15px] font-bold text-[#0f172a]">No Inventory Items Found</h3>
        <p className="text-xs text-[#64748b] mt-1 max-w-sm">
          No stored pallet stock matched your search criteria or no inventory items are allocated yet.
        </p>
      </div>
    );
  }

  const now = new Date();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-[#e2e8f0]">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 pl-6">
                Pallet Identifier
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Product & Batch Code
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Chamber / Rack Slot Location
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Temp Zone
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 text-right">
                Quantity / Weight
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Expiry Date
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 pr-6 text-right">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#e2e8f0]">
            {items.map((item) => {
              const categoryConfig =
                CATEGORY_BADGE_STYLE[item.temperature_category] || CATEGORY_BADGE_STYLE.chilled;
              const weightKg = item.weight || 0;
              const weightMt = weightKg / 1000;

              const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
              const isExpiringSoon =
                expiryDate && expiryDate.getTime() - now.getTime() <= fourteenDaysMs && expiryDate.getTime() > now.getTime();
              const isExpired = expiryDate && expiryDate.getTime() <= now.getTime();

              return (
                <TableRow key={item.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                  {/* Pallet Code */}
                  <TableCell className="py-4 pl-6">
                    <div className="font-mono text-[13px] font-bold text-[#2457e6] flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-[#2457e6] shrink-0" />
                      {item.pallet_code}
                    </div>
                    {item.is_partial && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                        Partial Pallet
                      </span>
                    )}
                  </TableCell>

                  {/* Product & Batch */}
                  <TableCell className="py-4">
                    <div className="font-semibold text-[#0f172a] text-xs">
                      {item.product_name}
                    </div>
                    <div className="text-[11px] text-[#64748b] font-mono mt-0.5">
                      Batch: {item.batch_code}
                    </div>
                  </TableCell>

                  {/* Chamber & Slot Location */}
                  <TableCell className="py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] text-xs font-mono font-semibold text-[#334155]">
                      <MapPin className="h-3.5 w-3.5 text-[#2457e6]" />
                      {item.chamber_name || item.chamber_code} / {item.slot_code}
                    </div>
                  </TableCell>

                  {/* Temperature Category */}
                  <TableCell className="py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${categoryConfig.bg} ${categoryConfig.text}`}
                    >
                      <Snowflake className="h-3 w-3" />
                      {categoryConfig.label}
                    </span>
                  </TableCell>

                  {/* Quantity & Weight */}
                  <TableCell className="py-4 text-right">
                    <div className="text-[13px] font-bold text-[#0f172a]">
                      {item.quantity.toLocaleString()} <span className="text-[10px] font-normal text-[#64748b]">units</span>
                    </div>
                    <div className="text-[11px] text-[#64748b] font-medium">
                      {weightKg.toLocaleString()} kg ({weightMt.toFixed(2)} MT)
                    </div>
                  </TableCell>

                  {/* Expiry Date */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#64748b]" />
                      <span className="text-xs font-medium text-[#0f172a]">
                        {expiryDate ? expiryDate.toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    {isExpired && (
                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3" /> Expired
                      </span>
                    )}
                    {!isExpired && isExpiringSoon && (
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> Expiring Soon
                      </span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-4 pr-6 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.status || "STORED"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
