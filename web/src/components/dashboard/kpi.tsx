import type { Kpi } from "@/lib/data/dashboard";

export function KpiCard({ label, value, subtext, trend, trendUp, icon: Icon, accent }: Kpi) {
  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-white ${accent}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <div className="font-display text-[26px] font-semibold text-[#0f172a] leading-none mb-1.5">{value}</div>
      <div className="text-[12px] text-[#64748b] mb-3">{subtext}</div>
      <div className="flex items-center gap-1 text-[11px] font-semibold">
        <span className={trendUp ? "text-[#059669]" : "text-[#d97706]"}>
          {trendUp ? "↑" : "•"} {trend}
        </span>
      </div>
    </div>
  );
}
