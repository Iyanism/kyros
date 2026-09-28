import { useEffect, useState } from "react";
import type { OutboundOrderResponse, OutboundOrderStatus } from "@/types/outbound";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OutboundOrderStatusBadge } from "./outbound_status_badge";
import { get_client } from "@/lib/api/client";
import { Building2, Calendar, CheckCircle2, XCircle, Truck, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OutboundDetailDialogProps {
  order: OutboundOrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: OutboundOrderStatus) => void;
  onOpenPickListFlow?: (order: OutboundOrderResponse) => void;
}

export function OutboundDetailDialog({
  order,
  open,
  onOpenChange,
  onStatusChange,
  onOpenPickListFlow,
}: OutboundDetailDialogProps) {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "operator";

  const [resolvedClientName, setResolvedClientName] = useState<string | null>(null);

  useEffect(() => {
    setResolvedClientName(null);
    if (!order || !isAdmin) return;
    let cancelled = false;
    get_client(order.client_id)
      .then((client) => {
        if (!cancelled) setResolvedClientName(client.name);
      })
      .catch(() => {
        // Admin-only lookup failure → fall back to the UUID label
      });
    return () => {
      cancelled = true;
    };
  }, [order?.id, isAdmin]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="font-display text-[20px] font-bold text-[#0f172a]">
                  OUT-{order.id.slice(0, 8)}
                </DialogTitle>
                <OutboundOrderStatusBadge status={order.status} />
              </div>
              <DialogDescription className="text-[12px] text-[#64748b] mt-1">
                Outbound dispatch manifest details and line item breakdown
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1" style={{ scrollbarWidth: "thin" }}>
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Client Organization
                </span>
                <p className="text-[13px] font-bold text-[#0f172a] truncate mt-0.5">
                  {resolvedClientName || order.client_name || `Client ${order.client_id.slice(0, 8)}`}
                </p>
                <p className="text-[11px] text-[#64748b]">Client ID: {order.client_id}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Creation Date
                </span>
                <p className="text-[13px] font-semibold text-[#0f172a] truncate mt-0.5">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items breakdown list */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-[#0f172a] flex items-center gap-2">
              <Package className="h-4 w-4 text-[#2457e6]" />
              Requested Dispatch Products
            </h4>
            <div className="rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
              <div className="divide-y divide-[#e2e8f0]">
                {order.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0f172a]">{item.product_name}</p>
                      <span className="text-[10px] text-[#64748b]">Line Item #{idx + 1}</span>
                    </div>
                    <div className="text-right font-bold text-[#0f172a]">
                      {item.quantity.toLocaleString()} <span className="text-[10px] font-normal text-[#64748b]">units</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#f8fafc] px-4 py-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-bold text-[#0f172a]">
                <span>Total Quantity</span>
                <span>{order.total_quantity.toLocaleString()} units</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#e2e8f0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-2">
              Workflow Actions
            </span>

            {isAdmin && order.status === "submitted" && onStatusChange && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 px-4"
                  onClick={() => onStatusChange(order.id, "approved")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve Outbound Order
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

            {isStaff && order.status === "approved" && (
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs flex items-center gap-1.5 px-4"
                onClick={() => {
                  onOpenChange(false);
                  if (onOpenPickListFlow) {
                    onOpenPickListFlow(order);
                  }
                }}
              >
                <Truck className="h-4 w-4" /> Execute Pick List & Dispatch
              </Button>
            )}

            {order.status === "dispatched" && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-800 flex items-center gap-2">
                <Truck className="h-4 w-4 text-purple-600" /> Outbound Dispatch Complete
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
