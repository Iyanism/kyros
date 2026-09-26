import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge } from "./payment_status_badge";
import { get_payments, refund_payment, download_payment_receipt } from "@/lib/api/payment";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Download, Receipt, RotateCcw } from "lucide-react";
import type { PaymentDetailResponse } from "@/types/payment";

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful refund so the page can reload invoices/payments. */
  onRefund?: () => void;
}

export function PaymentHistoryDialog({ open, onOpenChange, onRefund }: PaymentHistoryDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [payments, setPayments] = useState<PaymentDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadPayments = async () => {
      setIsLoading(true);
      try {
        const data = await get_payments();
        if (cancelled) return;
        setPayments(data);
      } catch (error) {
        console.error("Failed to load payments:", error);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadPayments();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleDownloadReceipt = async (paymentId: string, receiptNumber: string | null) => {
    try {
      toast.info("Downloading payment receipt...");
      await download_payment_receipt(paymentId, receiptNumber);
      toast.success("Receipt downloaded!");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRefund = async (payment: PaymentDetailResponse) => {
    const receiptLabel = payment.receipt_number || `REC-${payment.id.slice(0, 8)}`;
    const confirmed = window.confirm(
      `Refund ${receiptLabel} of ₹${payment.amount.toLocaleString()}? The invoice will revert to its previous paid amount.`
    );
    if (!confirmed) return;
    try {
      const updated = await refund_payment(payment.id);
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      toast.success(`${receiptLabel} refunded successfully`);
      onRefund?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-3 border-b border-[#e2e8f0]">
          <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a] flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#2457e6]" />
            Payment History & Receipts
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[#64748b]">
            All recorded Razorpay transactions, payment statuses, and downloadable receipts
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 pr-1" style={{ scrollbarWidth: "thin" }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
              <span className="text-xs text-[#64748b]">Loading payment history...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <CreditCard className="h-8 w-8 text-[#94a3b8] mb-2" />
              <p className="text-xs font-bold text-[#0f172a]">No Payment Transactions Found</p>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                No payment receipts have been recorded yet.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-[#f8fafc]">
                  <TableRow className="border-b border-[#e2e8f0]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3 pl-4">
                      Receipt # / Date
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3">
                      Invoice #
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3">
                      Method
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3 text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3 pr-4 text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#e2e8f0]">
                  {payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-[#f8fafc]">
                      <TableCell className="py-3 pl-4">
                        <div className="font-mono text-xs font-bold text-[#0f172a]">
                          {p.receipt_number || `REC-${p.id.slice(0, 8)}`}
                        </div>
                        <div className="text-[10px] text-[#64748b]">
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-xs font-mono text-[#2457e6]">
                        {p.invoice_number || "INV-N/A"}
                      </TableCell>

                      <TableCell className="py-3 text-xs capitalize font-medium text-[#334155]">
                        {p.method}
                      </TableCell>

                      <TableCell className="py-3 text-right text-xs font-bold text-[#0f172a]">
                        ₹{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="py-3">
                        <PaymentStatusBadge status={p.status} />
                      </TableCell>

                      <TableCell className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(p.id, p.receipt_number)}
                            className="h-7 text-xs text-[#2457e6] hover:bg-[#2457e6]/10 font-semibold"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Receipt
                          </Button>
                          {isAdmin && p.status === "captured" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleRefund(p)}
                              className="h-7 text-xs text-[#dc2626] hover:bg-red-50 font-semibold"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
