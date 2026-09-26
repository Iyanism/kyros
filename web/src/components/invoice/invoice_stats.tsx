import type { InvoiceDetailResponse } from "@/types/invoice";
import { CreditCard, DollarSign, Clock, CheckCircle2 } from "lucide-react";

interface InvoiceStatsProps {
  invoices: InvoiceDetailResponse[];
}

export function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paidCount = invoices.filter((inv) => inv.status === "paid").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Invoiced */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Total Invoiced Amount
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-medium text-[#2457e6] mt-0.5 block">
            {totalCount} Invoices Total
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
          <CreditCard className="h-5 w-5" />
        </div>
      </div>

      {/* Outstanding Balance */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Outstanding Balance
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            ₹{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
            Awaiting Payment
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5" />
        </div>
      </div>

      {/* Revenue Collected */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Paid Revenue Collected
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            ₹{paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {paidCount} Invoices Settled
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>

      {/* Total Active Billing Clients */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Avg Invoice Value
          </span>
          <p className="text-2xl font-bold font-display text-[#0f172a] mt-1">
            ₹{totalCount > 0 ? (totalAmount / totalCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
          </p>
          <span className="text-[11px] text-[#64748b] mt-0.5 block">
            Per Billed Statement
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <DollarSign className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
