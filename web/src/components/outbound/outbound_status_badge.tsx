import type { OutboundOrderStatus } from "@/types/outbound";
import { CheckCircle2, Clock, FileText, Truck, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: OutboundOrderStatus;
}

const STATUS_CONFIG: Record<
  OutboundOrderStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: FileText,
  },
  submitted: {
    label: "Submitted",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
  },
  dispatched: {
    label: "Dispatched",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Truck,
  },
};

export function OutboundOrderStatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {config.label}
    </span>
  );
}
