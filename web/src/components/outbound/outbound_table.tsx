import type { OutboundOrderResponse, OutboundOrderStatus } from "@/types/outbound";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OutboundOrderStatusBadge } from "./outbound_status_badge";
import { Eye, Trash2, Truck, Layers, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OutboundTableProps {
  orders: OutboundOrderResponse[];
  onSelectOrder: (order: OutboundOrderResponse) => void;
  onStatusChange: (orderId: string, status: OutboundOrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onOpenPickListFlow?: (order: OutboundOrderResponse) => void;
}

export function OutboundTable({
  orders,
  onSelectOrder,
  onStatusChange,
  onDeleteOrder,
  onOpenPickListFlow,
}: OutboundTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "operator";

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-[#cbd5e1] bg-white text-center">
        <div className="h-12 w-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-3 text-[#94a3b8]">
          <Truck className="h-6 w-6" />
        </div>
        <h3 className="text-[15px] font-bold text-[#0f172a]">No Outbound Orders Found</h3>
        <p className="text-xs text-[#64748b] mt-1 max-w-sm">
          No outbound dispatch orders match your search criteria or no dispatch requests have been initiated.
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
                Outbound Manifest
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Client Organization
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Requested Items
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 text-right">
                Total Quantity
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
            {orders.map((order) => {
              const firstItemName = order.items[0]?.product_name || "Unspecified item";
              const additionalCount = order.items.length - 1;

              return (
                <TableRow
                  key={order.id}
                  className="hover:bg-[#f8fafc]/80 transition-colors cursor-pointer"
                  onClick={() => onSelectOrder(order)}
                >
                  {/* Outbound Manifest */}
                  <TableCell className="py-4 pl-6">
                    <div className="font-mono text-[13px] font-bold text-[#2457e6]">
                      OUT-{order.id.slice(0, 8)}
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Created {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="py-4 font-semibold text-[#0f172a] text-xs">
                    {order.client_name || `Client ${order.client_id.slice(0, 8)}`}
                  </TableCell>

                  {/* Items summary */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#94a3b8] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#0f172a] truncate max-w-[200px]">
                          {firstItemName}
                        </p>
                        {additionalCount > 0 ? (
                          <span className="text-[10px] font-semibold text-[#2457e6]">
                            +{additionalCount} more item{additionalCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#94a3b8]">Single item</span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Total Quantity */}
                  <TableCell className="py-4 text-right">
                    <div className="text-[13px] font-bold text-[#0f172a]">
                      {order.total_quantity.toLocaleString()} <span className="text-[10px] font-normal text-[#64748b]">units</span>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <OutboundOrderStatusBadge status={order.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {isAdmin && order.status === "submitted" && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onStatusChange(order.id, "approved")}
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            title="Approve Outbound Request"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange(order.id, "rejected")}
                            className="h-8 px-2 text-xs border-red-200 text-red-700 hover:bg-red-50"
                            title="Reject Outbound Request"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}

                      {isStaff && order.status === "approved" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (onOpenPickListFlow) {
                              onOpenPickListFlow(order);
                            }
                          }}
                          className="h-8 px-2.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                        >
                          <Truck className="h-3.5 w-3.5 mr-1" /> Pick List & Dispatch
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectOrder(order)}
                        className="h-8 px-2 text-xs text-[#2457e6] hover:bg-[#2457e6]/10 font-semibold"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Details
                      </Button>

                      {/* Delete (admin / operator only — matches backend DELETE role) */}
                      {isStaff && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteOrder(order.id)}
                          className="h-8 w-8 p-0 text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#fee2e2]"
                          title="Delete Order"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
