import type { PaymentStatus } from "@/types/payment";
import { CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: PaymentStatus;
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  created: {
    label: "Created",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Clock,
  },
  authorized: {
    label: "Authorized",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Clock,
  },
  captured: {
    label: "Paid / Captured",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: RotateCcw,
  },
};

export function PaymentStatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.created;
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
