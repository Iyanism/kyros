import type { InvoiceDetailResponse, InvoiceStatus } from "@/types/invoice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "./invoice_status_badge";
import { Eye, Download, CreditCard, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InvoiceTableProps {
  invoices: InvoiceDetailResponse[];
  onSelectInvoice: (invoice: InvoiceDetailResponse) => void;
  onDownloadPdf: (invoiceId: string, invoiceNumber: string) => void;
  onStatusChange?: (invoiceId: string, status: InvoiceStatus) => void;
  onPayInvoice?: (invoice: InvoiceDetailResponse) => void;
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
  onDownloadPdf,
  onStatusChange,
  onPayInvoice,
}: InvoiceTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-[#cbd5e1] bg-white text-center">
        <div className="h-12 w-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-3 text-[#94a3b8]">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-[15px] font-bold text-[#0f172a]">No Invoices Found</h3>
        <p className="text-xs text-[#64748b] mt-1 max-w-sm">
          No billing statements match your search criteria or no invoices have been generated yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-[#e2e8f0]">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 pl-6">
                Invoice #
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Client Organization
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Billing Period
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 text-right">
                Subtotal / Taxes
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 text-right">
                Total Amount
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 pr-6 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#e2e8f0]">
            {invoices.map((inv) => {
              const startDate = new Date(inv.billing_period_start).toLocaleDateString();
              const endDate = new Date(inv.billing_period_end).toLocaleDateString();

              return (
                <TableRow
                  key={inv.id}
                  className="hover:bg-[#f8fafc]/80 transition-colors cursor-pointer"
                  onClick={() => onSelectInvoice(inv)}
                >
                  {/* Invoice # */}
                  <TableCell className="py-4 pl-6">
                    <div className="font-mono text-[13px] font-bold text-[#2457e6]">
                      {inv.invoice_number}
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Due: {new Date(inv.due_date).toLocaleDateString()}
                    </div>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="py-4 font-semibold text-[#0f172a] text-xs">
                    <div>{inv.client_name || `Client ${inv.client_id.slice(0, 8)}`}</div>
                    {inv.client_gstin && (
                      <span className="text-[10px] text-[#64748b] font-mono">
                        GSTIN: {inv.client_gstin}
                      </span>
                    )}
                  </TableCell>

                  {/* Billing Period */}
                  <TableCell className="py-4 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-[#334155]">
                      <Calendar className="h-3.5 w-3.5 text-[#64748b]" />
                      {startDate} — {endDate}
                    </div>
                  </TableCell>

                  {/* Subtotal / Tax */}
                  <TableCell className="py-4 text-right">
                    <div className="text-[12px] font-semibold text-[#0f172a]">
                      ₹{inv.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      Tax: ₹{inv.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </TableCell>

                  {/* Total Amount */}
                  <TableCell className="py-4 text-right">
                    <div className="text-[13px] font-bold text-[#0f172a]">
                      ₹{inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    {inv.amount_paid > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 block">
                        Paid: ₹{inv.amount_paid.toLocaleString()}
                      </span>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <InvoiceStatusBadge status={inv.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectInvoice(inv)}
                        className="h-8 px-2 text-xs text-[#2457e6] hover:bg-[#2457e6]/10 font-semibold"
                        title="View Full Invoice Details"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadPdf(inv.id, inv.invoice_number)}
                        className="h-8 w-8 p-0 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]"
                        title="Download PDF Invoice"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>

                      {inv.status !== "paid" && onPayInvoice && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onPayInvoice(inv)}
                          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          title="Pay Invoice"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay Now
                        </Button>
                      )}

                      {isAdmin && inv.status !== "paid" && onStatusChange && !onPayInvoice && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onStatusChange(inv.id, "paid")}
                          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          title="Mark Invoice Paid"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" /> Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
