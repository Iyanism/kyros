import { ArrowDownLeft, ArrowUpRight, Clock, Receipt } from "lucide-react";

import type { ActivityItem, ActivityType } from "@/lib/data/dashboard";

const activityConfig: Record<
  ActivityType,
  {
    icon: typeof ArrowDownLeft;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    iconBg: string;
    iconColor: string;
    label: string;
  }
> = {
  inbound: {
    icon: ArrowDownLeft,
    badgeBg: "bg-[#eff6ff]",
    badgeText: "text-[#2457e6]",
    badgeBorder: "border-[#bfdbfe]",
    iconBg: "bg-[#eff6ff]",
    iconColor: "text-[#2457e6]",
    label: "Inbound",
  },
  outbound: {
    icon: ArrowUpRight,
    badgeBg: "bg-[#f0fdf4]",
    badgeText: "text-[#166534]",
    badgeBorder: "border-[#bbf7d0]",
    iconBg: "bg-[#f0fdf4]",
    iconColor: "text-[#166534]",
    label: "Outbound",
  },
  billing: {
    icon: Receipt,
    badgeBg: "bg-[#fff7ed]",
    badgeText: "text-[#c2410c]",
    badgeBorder: "border-[#ffedd5]",
    iconBg: "bg-[#fff7ed]",
    iconColor: "text-[#c2410c]",
    label: "Billing",
  },
};

export function ActivityRow({ id, title, client, time, type, details }: ActivityItem) {
  const config = activityConfig[type] || activityConfig.inbound;
  const Icon = config.icon;

  return (
    <div className="group flex items-start gap-3.5 rounded-xl border border-[#e2e8f0] bg-white p-3.5 transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-xs">
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor} border ${config.badgeBorder}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border tracking-wider ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
              {id}
            </span>
            <h4 className="text-[13px] font-semibold text-[#0f172a] truncate group-hover:text-[#2457e6] transition-colors">
              {title}
            </h4>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#94a3b8] shrink-0">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
          <span className="font-semibold text-[#2457e6]">{client}</span>
          <span>•</span>
          <span className="truncate">{details}</span>
        </div>
      </div>
    </div>
  );
}
