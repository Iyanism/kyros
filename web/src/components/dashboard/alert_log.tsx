import { AlertTriangle, CheckCircle2, Clock, Info } from "lucide-react";

import type { AlertItem, AlertSeverity } from "@/lib/data/dashboard";

const alertConfig: Record<
  AlertSeverity,
  {
    icon: typeof AlertTriangle;
    bg: string;
    border: string;
    titleColor: string;
    textColor: string;
    badgeBg: string;
    badgeText: string;
    label: string;
  }
> = {
  warning: {
    icon: AlertTriangle,
    bg: "bg-[#fffbeb]",
    border: "border-[#fde68a]",
    titleColor: "text-[#92400e]",
    textColor: "text-[#b45309]",
    badgeBg: "bg-[#fef3c7]",
    badgeText: "text-[#92400e]",
    label: "Warning",
  },
  info: {
    icon: Info,
    bg: "bg-[#eff6ff]",
    border: "border-[#bfdbfe]",
    titleColor: "text-[#1e40af]",
    textColor: "text-[#1d4ed8]",
    badgeBg: "bg-[#dbeafe]",
    badgeText: "text-[#1e40af]",
    label: "Info",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-[#f0fdf4]",
    border: "border-[#bbf7d0]",
    titleColor: "text-[#166534]",
    textColor: "text-[#15803d]",
    badgeBg: "bg-[#dcfce7]",
    badgeText: "text-[#166534]",
    label: "Success",
  },
};

export function AlertBox({ severity, title, desc, time }: AlertItem) {
  const config = alertConfig[severity] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`group rounded-xl border ${config.border} ${config.bg} p-3.5 transition-all duration-200 hover:shadow-xs`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${config.badgeBg} ${config.badgeText}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}>
                {config.label}
              </span>
              <h4 className={`text-[13px] font-bold ${config.titleColor} truncate`}>
                {title}
              </h4>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#94a3b8] shrink-0">
              <Clock className="h-3 w-3" />
              <span>{time}</span>
            </div>
          </div>

          <p className={`text-[11.5px] leading-relaxed ${config.textColor} font-normal opacity-90`}>
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}
