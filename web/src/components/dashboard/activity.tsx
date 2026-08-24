import type { ActivityItem } from "@/lib/data/dashboard";

const badgeStyles = {
  inbound: "bg-[#eff6ff] text-[#2457e6] border-[#bfdbfe]",
  outbound: "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]",
  billing: "bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]",
};

export function ActivityRow({ id, title, client, time, type, details }: ActivityItem) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3.5 transition hover:bg-white hover:border-[#e2e8f0]">
      <span className={`mt-0.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase border ${badgeStyles[type]}`}>
        {id}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[13px] font-semibold text-[#0f172a] truncate">{title}</h4>
          <span className="text-[10px] font-medium text-[#94a3b8] shrink-0">{time}</span>
        </div>
        <p className="text-[11px] font-medium text-[#2457e6]">{client}</p>
        <p className="text-[11px] text-[#64748b] mt-0.5">{details}</p>
      </div>
    </div>
  );
}
