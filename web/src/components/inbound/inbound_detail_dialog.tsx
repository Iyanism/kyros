import type { InboundOrderResponse, OrderStatus } from "@/types/order";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InboundOrderStatusBadge } from "./inbound_status_badge";
import { InboundItemsList } from "./inbound_items_list";
import { Building2, Truck, Calendar, Clock, PackageCheck, CheckCircle2, XCircle, Play, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InboundDetailDialogProps {
  order: InboundOrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
  onOpenProcessingFlow?: (order: InboundOrderResponse) => void;
}

export function InboundDetailDialog({
  order,
  open,
  onOpenChange,
  onStatusChange,
  onOpenProcessingFlow,
}: InboundDetailDialogProps) {
  const { user } = useAuth();
  if (!order) return null;

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "operator";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="font-display text-[20px] font-bold text-[#0f172a]">
                  INB-{order.id.slice(0, 8)}
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
                  {order.client_name || `Client ${order.client_id.slice(0, 8)}`}
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

            {/* Updated Timestamp */}
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Last Updated
                </span>
                <p className="text-[13px] font-semibold text-[#0f172a] truncate mt-0.5">
                  {new Date(order.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

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

          {/* Role-Based Action Buttons */}
          <div className="pt-3 border-t border-[#e2e8f0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-2">
              Workflow Actions
            </span>

            {/* Admin Approval / Rejection for Submitted Orders */}
            {isAdmin && order.status === "submitted" && onStatusChange && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 px-4"
                  onClick={() => onStatusChange(order.id, "approved")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve Order & Reserve Slots
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 text-xs flex items-center gap-1.5"
                  onClick={() => onStatusChange(order.id, "rejected")}
                >
                  <XCircle className="h-4 w-4" /> Reject Order
                </Button>
              </div>
            )}

            {/* Staff / Operator In-Transit & Arrival Transitions */}
            {isStaff && order.status === "approved" && onStatusChange && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs flex items-center gap-1.5 px-4"
                  onClick={() => onStatusChange(order.id, "in_transit")}
                >
                  <Truck className="h-4 w-4" /> Mark Order In-Transit
                </Button>

                <Button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5 px-4"
                  onClick={() => onStatusChange(order.id, "arrived")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Vehicle Arrived
                </Button>
              </div>
            )}

            {isStaff && order.status === "in_transit" && onStatusChange && (
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5 px-4"
                onClick={() => onStatusChange(order.id, "arrived")}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark Vehicle Arrived
              </Button>
            )}

            {/* Operator Start / Resume Intake Processing */}
            {isStaff && (order.status === "arrived" || order.status === "processing") && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white text-xs flex items-center gap-1.5 px-4"
                  onClick={() => {
                    if (order.status === "arrived" && onStatusChange) {
                      onStatusChange(order.id, "processing");
                    }
                    if (onOpenProcessingFlow) {
                      onOpenProcessingFlow(order);
                    }
                  }}
                >
                  <Play className="h-4 w-4" /> {order.status === "arrived" ? "Start Intake Processing & Palletisation" : "Resume Palletisation & Slot Allocation"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {order.status === "stored" && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Intake Complete & Stored in Cold Storage
              </div>
            )}

            {order.status === "rejected" && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" /> Order Rejected by Administrator
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

