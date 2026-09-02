import type { InboundOrderResponse, OrderStatus } from "@/types/order";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InboundOrderStatusBadge } from "./inbound_status_badge";
import { InboundItemsList } from "./inbound_items_list";
import { Building2, Truck, Calendar, Clock, FileText, PackageCheck } from "lucide-react";

interface InboundDetailDialogProps {
  order: InboundOrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
}

export function InboundDetailDialog({
  order,
  open,
  onOpenChange,
  onStatusChange,
}: InboundDetailDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="font-display text-[20px] font-bold text-[#0f172a]">
                  {order.order_number}
                </DialogTitle>
                <InboundOrderStatusBadge status={order.status} />
              </div>
              <DialogDescription className="text-[12px] text-[#64748b] mt-1">
                Inbound intake manifest details and order item breakdown
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1" style={{ scrollbarWidth: "thin" }}>
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Client Info */}
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Client Organization
                </span>
                <p className="text-[13px] font-bold text-[#0f172a] truncate mt-0.5">
                  {order.client_name || order.client_id}
                </p>
                <p className="text-[11px] text-[#64748b]">Client ID: {order.client_id}</p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
                <Truck className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Transport Vehicle
                </span>
                <p className="text-[13px] font-bold text-[#0f172a] truncate mt-0.5">
                  {order.vehicle_number}
                </p>
                <p className="text-[11px] text-[#64748b]">Inbound Carrier</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Created Date
                </span>
                <p className="text-[13px] font-semibold text-[#0f172a] truncate mt-0.5">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Received Timestamp */}
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Received Date
                </span>
                <p className="text-[13px] font-semibold text-[#0f172a] truncate mt-0.5">
                  {order.received_at ? new Date(order.received_at).toLocaleString() : "Not received yet"}
                </p>
              </div>
            </div>
          </div>

          {/* Notes (if any) */}
          {order.notes && (
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#fffbeb] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[#b45309] font-bold">
                <FileText className="h-3.5 w-3.5" /> Intake Notes
              </div>
              <p className="text-[#78350f]">{order.notes}</p>
            </div>
          )}

          {/* Items Section using InboundItemsList */}
          <div className="space-y-2">
            <h4 className="text-[13px] font-bold text-[#0f172a] flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-[#2457e6]" />
              Items List & Quantity Breakdown
            </h4>
            <InboundItemsList
              items={order.items}
              totalQuantityOverride={order.total_quantity}
              maxHeight="max-h-64"
            />
          </div>

          {/* Quick Status Update Actions */}
          {onStatusChange && (
            <div className="pt-2 border-t border-[#e2e8f0]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-2">
                Update Order Status
              </span>
              <div className="flex flex-wrap gap-2">
                {(["pending", "received", "inspecting", "stored", "cancelled"] as OrderStatus[]).map((st) => (
                  <Button
                    key={st}
                    type="button"
                    variant={order.status === st ? "default" : "outline"}
                    size="sm"
                    className={`text-xs capitalize ${
                      order.status === st ? "bg-[#2457e6] text-white" : "text-[#475569]"
                    }`}
                    onClick={() => onStatusChange(order.id, st)}
                  >
                    {st}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
