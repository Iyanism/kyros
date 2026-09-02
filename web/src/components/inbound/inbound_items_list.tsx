import type { OrderItem } from "@/types/order";
import { Package, Hash, Calendar, Scale } from "lucide-react";

interface InboundItemsListProps {
  items: OrderItem[];
  maxHeight?: string;
  totalQuantityOverride?: number;
  showSummaryBar?: boolean;
  emptyMessage?: string;
}

export function calculateTotalWeightInKg(items: OrderItem[]): number {
  return items.reduce((acc, item) => {
    let weightInKg = item.quantity;
    if (item.unit === "g") weightInKg = item.quantity / 1000;
    else if (item.unit === "lb") weightInKg = item.quantity * 0.453592;
    else if (item.unit === "oz") weightInKg = item.quantity * 0.0283495;
    return acc + weightInKg;
  }, 0);
}

export function InboundItemsList({
  items,
  maxHeight = "max-h-72",
  totalQuantityOverride,
  showSummaryBar = true,
  emptyMessage = "No items added yet.",
}: InboundItemsListProps) {
  const calculatedTotalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const displayTotalQuantity = totalQuantityOverride ?? calculatedTotalQuantity;
  const totalWeightKg = calculateTotalWeightInKg(items);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-center">
        <Package className="h-8 w-8 text-[#94a3b8] mb-2" />
        <p className="text-xs font-medium text-[#64748b]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden flex flex-col">
      {/* Scrollable Container with Custom Scrollbar */}
      <div
        className={`overflow-y-auto p-3 space-y-2.5 ${maxHeight} scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400`}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 transparent",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={`${item.product_name}-${idx}`}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] hover:bg-[#f1f5f9]/80 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2457e6]/10 text-[11px] font-bold text-[#2457e6]">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <h4 className="text-[13px] font-semibold text-[#0f172a] truncate">
                  {item.product_name || "Unnamed Product"}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-[#64748b]">
                  {item.batch_number && (
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#e2e8f0]">
                      <Hash className="h-3 w-3 text-[#94a3b8]" />
                      Batch: <strong className="text-[#334155] font-medium">{item.batch_number}</strong>
                    </span>
                  )}
                  {item.expiry_date && (
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#e2e8f0]">
                      <Calendar className="h-3 w-3 text-[#94a3b8]" />
                      Exp: <strong className="text-[#334155] font-medium">{item.expiry_date}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity and Unit pill */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className="text-[14px] font-bold text-[#0f172a]">
                {Number(item.quantity).toLocaleString()}
              </span>
              <span className="rounded-md bg-[#2457e6]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#2457e6]">
                {item.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Prominent Bottom Total Quantity / Weight Summary Bar */}
      {showSummaryBar && (
        <div className="sticky bottom-0 z-10 border-t border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
            <Scale className="h-4 w-4 text-[#2457e6]" />
            <span>Total Items: <strong className="text-[#0f172a]">{items.length}</strong></span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[11px] text-[#64748b] block font-medium uppercase tracking-wider">
                Total Quantity (InboundOrderRequest)
              </span>
              <span className="text-[15px] font-extrabold text-[#2457e6]">
                {displayTotalQuantity.toLocaleString()} <span className="text-[11px] font-semibold">units</span>
              </span>
            </div>

            <div className="h-8 w-px bg-[#cbd5e1] hidden sm:block" />

            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-[#64748b] block font-medium uppercase tracking-wider">
                Net Weight (Normalized)
              </span>
              <span className="text-[13px] font-bold text-[#0f172a]">
                {totalWeightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-[11px] font-semibold text-[#64748b]">kg</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
