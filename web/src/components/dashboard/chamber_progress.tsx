import type { ChamberSummary } from "@/lib/data/dashboard";

export function ChamberProgressCard({ code, name, temp, occupancy, totalCapacity, used, color, status }: ChamberSummary) {
  return (
    <div className="rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-4 transition hover:bg-white hover:border-[#cbd5e1] hover:shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-[14px] font-bold text-[#0f172a]">{code}</span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#475569] border border-[#e2e8f0]">{temp}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{status}</span>
      </div>

      <div className="text-[12px] text-[#64748b] mb-3 truncate">{name}</div>

      {/* Chamber Occupancy Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-[#475569]">Capacity Used</span>
          <span className="text-[#0f172a]">{occupancy}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${occupancy}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#94a3b8] pt-0.5">
          <span>{used}</span>
          <span>Max {totalCapacity}</span>
        </div>
      </div>
    </div>
  );
}
