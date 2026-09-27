import { PackageSearch, Boxes } from "lucide-react";
import type { ClientInventorySummary, PalletItemResponse } from "@/types/inventory";

interface ClientInventorySummaryProps {
  items: PalletItemResponse[];
}

/** Groups the currently listed pallets by (product, batch) — mirrors the backend rollup. */
function deriveSummaries(items: PalletItemResponse[]): ClientInventorySummary[] {
  const groups = new Map<string, ClientInventorySummary>();

  for (const item of items) {
    const key = `${item.product_name}::${item.batch_code}`;
    const entry =
      groups.get(key) ??
      ({
        product_name: item.product_name,
        batch_code: item.batch_code,
        expiry_date: item.expiry_date,
        temperature_category: item.temperature_category,
        total_quantity: 0,
        total_weight_mt: 0,
        pallet_count: 0,
      } satisfies ClientInventorySummary);

    entry.total_quantity = Math.round((entry.total_quantity + item.quantity) * 1e4) / 1e4;
    entry.total_weight_mt = Math.round((entry.total_weight_mt + item.weight) * 1e4) / 1e4;
    entry.pallet_count += 1;
    groups.set(key, entry);
  }

  return [...groups.values()].sort((a, b) => b.total_quantity - a.total_quantity);
}

export function ClientInventorySummaryPanel({ items }: ClientInventorySummaryProps) {
  const summaries = deriveSummaries(items);

  const totals = summaries.reduce(
    (acc, s) => ({
      quantity: Math.round((acc.quantity + s.total_quantity) * 1e4) / 1e4,
      weight: Math.round((acc.weight + s.total_weight_mt) * 1e4) / 1e4,
      pallets: acc.pallets + s.pallet_count,
    }),
    { quantity: 0, weight: 0, pallets: 0 },
  );

  return (
    <div className="rounded-2xl bg-white border border-[#e2e8f0] shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
        <div className="flex items-center gap-2">
          <PackageSearch className="h-4 w-4 text-[#2457e6]" />
          <h3 className="text-[13px] font-bold text-[#0f172a]">
            Inventory Rollup by Product & Batch
          </h3>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-semibold text-[#64748b]">
          <span>{summaries.length} groups</span>
          <span className="flex items-center gap-1">
            <Boxes className="h-3.5 w-3.5 text-[#2457e6]" />
            {totals.pallets} pallets
          </span>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-xs font-bold text-[#0f172a]">No Inventory to Summarise</p>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Stock matching the current filters will be grouped here.
          </p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white border-b border-[#e2e8f0]">
              <tr>
                <th className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-4 py-2">
                  Product / Batch
                </th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-4 py-2">
                  Expiry
                </th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-4 py-2">
                  Zone
                </th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-4 py-2 text-right">
                  Quantity
                </th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-4 py-2 text-right">
                  Weight (MT)
                </th>
                <th className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] px-4 py-2 text-right">
                  Pallets
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {summaries.map((s) => (
                <tr key={`${s.product_name}-${s.batch_code}`} className="hover:bg-[#f8fafc]">
                  <td className="px-4 py-2.5">
                    <div className="text-xs font-semibold text-[#0f172a]">{s.product_name}</div>
                    <div className="text-[10px] text-[#64748b] font-mono">{s.batch_code}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-[#334155]">
                    {new Date(s.expiry_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-md bg-[#2457e6]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#2457e6]">
                      {s.temperature_category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-[#0f172a]">
                    {s.total_quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-semibold text-[#334155]">
                    {s.total_weight_mt.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-semibold text-[#334155]">
                    {s.pallet_count}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#f8fafc] border-t border-[#e2e8f0]">
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]"
                >
                  Total (current view)
                </td>
                <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">
                  {totals.quantity.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">
                  {totals.weight.toFixed(3)}
                </td>
                <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">
                  {totals.pallets}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
