import { Snowflake, Thermometer, Warehouse } from "lucide-react";
import type { ChamberStatus, ChamberSummary } from "@/types/chamber";
import { capitalise } from "@/utils/string-operations";

interface ChamberTabsProps {
  chambers: ChamberSummary[];
  selectedChamber: ChamberSummary | null;
  onSelectChamber: (chamber: ChamberSummary) => void;
}

const statusColors: Record<ChamberStatus, { bg: string; text: string; border: string }> = {
  active: { bg: "bg-[#ecfdf5]", text: "text-[#065f46]", border: "border-[#a7f3d0]" },
  maintenance: { bg: "bg-[#eff6ff]", text: "text-[#1e40af]", border: "border-[#bfdbfe]" },
  inactive: { bg: "bg-[#fffbeb]", text: "text-[#92400e]", border: "border-[#fde68a]" },
};

export function ChamberTabs({
  chambers,
  selectedChamber,
  onSelectChamber,
}: ChamberTabsProps) {
  if (!selectedChamber) {
    return (
      <div className="flex items-center justify-center h-32 text-[#64748b]">
        No chambers available.
      </div>
    );
  }

  const occupancyPercent = Math.round(
    (selectedChamber?.used_capacity / selectedChamber?.total_capacity) * 100
  );
  const statusStyle = statusColors[selectedChamber?.status] || statusColors.active;

  return (
    <div className="space-y-4">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {chambers.map((chamber) => (
            <button
              key={chamber.id}
              type="button"
              onClick={() => onSelectChamber(chamber)}
              className={`flex items-center gap-2.5 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition ${
                selectedChamber?.id === chamber.id
                  ? "bg-white text-[#2457e6] border border-[#2457e6]/30 shadow-xs"
                  : "text-[#64748b] hover:bg-white/60 hover:text-[#0f172a]"
              }`}
            >
              <Warehouse className="h-4 w-4" />
              <span>{chamber.code}</span>
              <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] text-[#475569]">
                {chamber.temperature}
              </span>
            </button>
          ))}
        </div>

        {/* Legend for Visual Slot Map */}
        <div className="flex items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-[11px] font-medium text-[#475569]">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[#2457e6]" /> Occupied (1.0 MT)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-500" /> Reserved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-500" /> Maintenance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-[#cbd5e1] bg-[#f8fafc]" /> Available Slot
          </span>
        </div>
      </div>

      {/* Selected Chamber Summary Bar */}
      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2457e6] border border-[#bfdbfe]">
            <Snowflake className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[16px] font-bold text-[#0f172a]">
                {selectedChamber?.code} · {selectedChamber?.name}
              </h2>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {capitalise(selectedChamber?.status)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#64748b] mt-0.5">
              <span className="flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-[#2457e6]" />
                Target: {selectedChamber?.temperature}
              </span>
              <span>•</span>
              <span>Type: {capitalise(selectedChamber?.category)} Zone</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Capacity Occupancy
            </div>
            <div className="text-[14px] font-bold text-[#0f172a] mt-0.5">
              {selectedChamber?.used_capacity} / {selectedChamber?.total_capacity} MT ({occupancyPercent}%)
            </div>
          </div>

          <div className="w-28 bg-[#f1f5f9] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2457e6] h-full rounded-full transition-all duration-300"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
