import type { InboundOrderResponse, OrderStatus } from "@/types/order";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InboundOrderStatusBadge } from "./inbound_status_badge";
import { calculateTotalWeightInKg } from "./inbound_items_list";
import { Eye, Trash2, Truck, Package, Layers } from "lucide-react";

interface InboundTableProps {
  orders: InboundOrderResponse[];
  onSelectOrder: (order: InboundOrderResponse) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function InboundTable({
  orders,
  onSelectOrder,
  onStatusChange,
  onDeleteOrder,
}: InboundTableProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-[#cbd5e1] bg-white text-center">
        <div className="h-12 w-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-3 text-[#94a3b8]">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="text-[15px] font-bold text-[#0f172a]">No Inbound Orders Found</h3>
        <p className="text-xs text-[#64748b] mt-1 max-w-sm">
          No inbound shipment orders match your filter criteria or no intake manifests have been created yet.
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
                Order Manifest
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Client Organization
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Vehicle #
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5">
                Items breakdown
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3.5 text-right">
                Total Quantity / Weight
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
              const weightKg = calculateTotalWeightInKg(order.items);
              const firstItemName = order.items[0]?.product_name || "Unspecified item";
              const additionalItemsCount = order.items.length - 1;

              return (
                <TableRow
                  key={order.id}
                  className="hover:bg-[#f8fafc]/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectOrder(order)}
                >
                  {/* Order Manifest */}
                  <TableCell className="py-4 pl-6">
                    <div className="font-mono text-[13px] font-bold text-[#2457e6]">
                      {order.order_number}
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Created {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="py-4 font-semibold text-[#0f172a] text-xs">
                    {order.client_name || order.client_id}
                  </TableCell>

                  {/* Vehicle Number */}
                  <TableCell className="py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] text-xs font-mono font-semibold text-[#334155]">
                      <Truck className="h-3.5 w-3.5 text-[#64748b]" />
                      {order.vehicle_number}
                    </div>
                  </TableCell>

                  {/* Items summary */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#94a3b8] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#0f172a] truncate max-w-[200px]">
                          {firstItemName}
                        </p>
                        {additionalItemsCount > 0 ? (
                          <span className="text-[10px] font-semibold text-[#2457e6] hover:underline">
                            +{additionalItemsCount} more item{additionalItemsCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#94a3b8]">Single item</span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Total Quantity / Weight */}
                  <TableCell className="py-4 text-right">
                    <div className="text-[13px] font-bold text-[#0f172a]">
                      {order.total_quantity.toLocaleString()} <span className="text-[10px] font-normal text-[#64748b]">units</span>
                    </div>
                    <div className="text-[11px] text-[#64748b] font-medium">
                      {weightKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg net
                    </div>
                  </TableCell>

                  {/* Status Badge & Selector */}
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <InboundOrderStatusBadge status={order.status} />
                      <select
                        aria-label="Change status"
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                        className="bg-transparent text-[11px] font-medium text-[#64748b] hover:text-[#0f172a] focus:outline-none cursor-pointer border border-transparent hover:border-[#cbd5e1] rounded px-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="received">Received</option>
                        <option value="inspecting">Inspecting</option>
                        <option value="stored">Stored</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectOrder(order)}
                        className="h-8 px-2.5 text-xs text-[#2457e6] hover:bg-[#2457e6]/10 font-semibold"
                        title="View Full Details"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
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
