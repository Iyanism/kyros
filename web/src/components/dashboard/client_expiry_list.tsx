import { ArrowUpRight, Clock, PackageCheck } from "lucide-react";
import type { ClientInventorySummary } from "@/types/inventory";

interface ClientExpiryListProps {
  batches: (ClientInventorySummary & { daysLeft: number })[];
}

export function ClientExpiryList({ batches }: ClientExpiryListProps) {
  const rows = batches.slice(0, 6);

  return (
    <section className="lg:col-span-5 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
            Expiring Soon
          </h3>
          <span className="rounded-md bg-[#fef3c7] px-2 py-0.5 text-[10px] font-semibold text-[#b45309]">
            &le; 14 Days
          </span>
          {rows.length > 0 && (
            <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-[10px] font-bold text-[#c2410c]">
              {batches.length}
            </span>
          )}
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="space-y-2.5 flex-1">
          {rows.map((batch) => {
            const isExpired = batch.daysLeft <= 0;
            return (
              <div
                key={`${batch.batch_code}-${batch.expiry_date}`}
                className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    isExpired
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-amber-50 border-amber-200 text-amber-600"
                  }`}
                >
                  <Clock className="h-4.5 w-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0f172a] truncate">
                    {batch.product_name}
                  </p>
                  <p className="text-[11px] text-[#64748b] truncate">
                    Batch {batch.batch_code} · {batch.total_quantity.toLocaleString()} units ·{" "}
                    {batch.total_weight_mt.toFixed(2)} MT
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] font-semibold text-[#475569]">
                    {new Date(batch.expiry_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      isExpired
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {isExpired
                      ? `Expired ${Math.abs(batch.daysLeft)}d ago`
                      : `${batch.daysLeft}d left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#bbf7d0] bg-[#f0fdf4]">
          <PackageCheck className="h-8 w-8 text-emerald-500 mb-2" />
          <h4 className="text-xs font-bold text-[#15803d]">No stock expiring soon</h4>
          <p className="text-[11px] text-[#166534] mt-0.5">
            Nothing expires in the next 14 days.
          </p>
        </div>
      )}

      <div className="mt-4 border-t border-[#f1f5f9] pt-3 flex items-center justify-between text-[11px]">
        <span className="text-[#64748b]">
          {batches.length > 0
            ? `Showing ${rows.length} of ${batches.length} flagged batches`
            : "Stock freshness monitored daily"}
        </span>
        <button
          type="button"
          onClick={() => (window.location.href = "/inventory")}
          className="font-semibold text-[#2457e6] hover:underline flex items-center gap-1"
        >
          View inventory <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
}
