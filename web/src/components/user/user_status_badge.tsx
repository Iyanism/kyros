import { CheckCircle2, XCircle } from "lucide-react";

interface UserStatusBadgeProps {
  isActive: boolean;
}

export function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#166534] bg-[#f0fdf4] px-2 py-0.5 rounded-md border border-[#bbf7d0]">
        <CheckCircle2 className="h-3 w-3" /> Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#991b1b] bg-[#fef2f2] px-2 py-0.5 rounded-md border border-[#fecaca]">
      <XCircle className="h-3 w-3" /> Deactivated
    </span>
  );
}