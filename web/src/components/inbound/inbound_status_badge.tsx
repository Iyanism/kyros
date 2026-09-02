import type { OrderStatus } from "@/types/order";
import { CheckCircle2, Clock, AlertCircle, PackageCheck, XCircle } from "lucide-react";

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ElementType;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    className: "bg-[#fef3c7] text-[#b45309] border-[#fde68a]",
    icon: Clock,
  },
  received: {
    label: "Received",
    className: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]",
    icon: PackageCheck,
  },
  inspecting: {
    label: "Inspecting",
    className: "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]",
    icon: AlertCircle,
  },
  stored: {
    label: "Stored",
    className: "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]",
    icon: XCircle,
  },
};

export function InboundOrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
