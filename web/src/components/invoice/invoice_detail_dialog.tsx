import type { InvoiceDetailResponse, InvoiceStatus } from "@/types/invoice";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "./invoice_status_badge";
import { Download, Building2, Calendar, FileText, CheckCircle2, Send, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InvoiceDetailDialogProps {
  invoice: InvoiceDetailResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPdf: (invoiceId: string, invoiceNumber: string) => void;
  onStatusChange?: (invoiceId: string, status: InvoiceStatus) => void;
  onPayInvoice?: (invoice: InvoiceDetailResponse) => void;
}

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
  onDownloadPdf,
  onStatusChange,
  onPayInvoice,
}: InvoiceDetailDialogProps) {
  const { user } = useAuth();
  if (!invoice) return null;

  const isAdmin = user?.role === "admin";
  const balanceDue = Math.max(0, invoice.total_amount - invoice.amount_paid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="font-display text-[20px] font-bold text-[#0f172a]">
                  {invoice.invoice_number}
                </DialogTitle>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <DialogDescription className="text-[12px] text-[#64748b] mt-1">
                Tax Invoice Statement & Line Item Breakdown
              </DialogDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDownloadPdf(invoice.id, invoice.invoice_number)}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1" style={{ scrollbarWidth: "thin" }}>
          {/* Bill From / Bill To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
            {/* Bill From (Cold Storage Warehouse) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                Billed From (Provider)
              </span>
              <p className="text-xs font-bold text-[#0f172a]">Kyros Cold Storage Logistics</p>
              <p className="text-[11px] text-[#64748b]">Plot 42, Cold Chain Zone, Industrial Area</p>
              <p className="text-[11px] text-[#64748b]">State: Maharashtra · GSTIN: 27AAAAA0000A1Z5</p>
            </div>

            {/* Bill To (Client) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                Billed To (Client Organization)
              </span>
              <p className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#2457e6]" />
                {invoice.client_name || `Client ${invoice.client_id.slice(0, 8)}`}
              </p>
              <p className="text-[11px] text-[#64748b]">{invoice.client_address || "Client Address Unspecified"}</p>
              <p className="text-[11px] text-[#64748b]">
                State: {invoice.client_state || "N/A"} · GSTIN: {invoice.client_gstin || "URP (Unregistered)"}
              </p>
            </div>
          </div>

          {/* Dates & Period Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
                Billing Period Start
              </span>
              <span className="text-xs font-semibold text-[#0f172a] mt-0.5 block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#64748b]" />
                {new Date(invoice.billing_period_start).toLocaleDateString()}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
                Billing Period End
              </span>
              <span className="text-xs font-semibold text-[#0f172a] mt-0.5 block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#64748b]" />
                {new Date(invoice.billing_period_end).toLocaleDateString()}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
                Payment Due Date
              </span>
              <span className="text-xs font-semibold text-[#0f172a] mt-0.5 block">
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
                Invoice Date
              </span>
              <span className="text-xs font-semibold text-[#0f172a] mt-0.5 block">
                {new Date(invoice.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-bold text-[#0f172a] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#2457e6]" />
              Services & Line Item Charges
            </h4>
            <div className="rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
              <div className="divide-y divide-[#e2e8f0]">
                {invoice.line_items && invoice.line_items.length > 0 ? (
                  invoice.line_items.map((item, idx) => (
                    <div key={item.id || idx} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#0f172a]">{item.description}</p>
                        <p className="text-[10px] text-[#64748b]">
                          {item.quantity.toLocaleString()} {item.unit} @ ₹{item.unit_rate_snapshot.toFixed(2)} / {item.unit}
                        </p>
                      </div>
                      <div className="text-right font-bold text-[#0f172a]">
                        ₹{item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-[#64748b] text-center">
                    No individual line items detailed.
                  </div>
                )}
              </div>

              {/* Financial Totals Breakdown */}
              <div className="bg-[#f8fafc] p-4 border-t border-[#e2e8f0] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Subtotal</span>
                  <span>₹{invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                {invoice.cgst_amount ? (
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>CGST ({invoice.cgst_rate}%)</span>
                    <span>₹{invoice.cgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null}

                {invoice.sgst_amount ? (
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>SGST ({invoice.sgst_rate}%)</span>
                    <span>₹{invoice.sgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null}

                {invoice.igst_amount ? (
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>IGST ({invoice.igst_rate}%)</span>
                    <span>₹{invoice.igst_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between font-bold text-[#0f172a] text-sm pt-2 border-t border-[#e2e8f0]">
                  <span>Total Amount</span>
                  <span>₹{invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between font-semibold text-emerald-700 text-xs">
                  <span>Amount Paid</span>
                  <span>₹{invoice.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between font-bold text-slate-800 text-xs pt-1">
                  <span>Balance Due</span>
                  <span className={balanceDue > 0 ? "text-amber-700" : "text-emerald-700"}>
                    ₹{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions & Pay Button */}
          <div className="pt-3 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
            <div>
              {invoice.status !== "paid" && onPayInvoice && (
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 flex items-center gap-1.5"
                  onClick={() => {
                    onOpenChange(false);
                    onPayInvoice(invoice);
                  }}
                >
                  <CreditCard className="h-4 w-4" /> Pay Invoice ₹
                  {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Button>
              )}
            </div>

            {isAdmin && onStatusChange && (
              <div className="flex flex-wrap items-center gap-2">
                {invoice.status === "draft" && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
                    onClick={() => onStatusChange(invoice.id, "sent")}
                  >
                    <Send className="h-3.5 w-3.5" /> Mark Sent to Client
                  </Button>
                )}

                {invoice.status !== "paid" && !onPayInvoice && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
                    onClick={() => onStatusChange(invoice.id, "paid")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
