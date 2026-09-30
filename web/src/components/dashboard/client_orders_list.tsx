import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { InboundOrderStatusBadge } from "@/components/inbound/inbound_status_badge";
import { OutboundOrderStatusBadge } from "@/components/outbound/outbound_status_badge";
import type { OrderStatus } from "@/types/order";
import type { OutboundOrderStatus } from "@/types/outbound";

export interface ClientOrderRow {
  id: string;
  direction: "inbound" | "outbound";
  quantity: number;
  status: OrderStatus | OutboundOrderStatus;
  createdAt: string;
}

interface ClientOrdersListProps {
  orders: ClientOrderRow[];
}

export function ClientOrdersList({ orders }: ClientOrdersListProps) {
  return (
    <section className="lg:col-span-7 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
            Recent Orders
          </h3>
          <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
            Inbound &amp; Outbound
          </span>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-2.5 flex-1">
          {orders.map((order) => {
            const isInbound = order.direction === "inbound";
            return (
              <div
                key={`${order.direction}-${order.id}`}
                className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    isInbound
                      ? "bg-[#eff6ff] border-[#bfdbfe] text-[#2457e6]"
                      : "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]"
                  }`}
                >
                  {isInbound ? (
                    <ArrowDownLeft className="h-4.5 w-4.5" />
                  ) : (
                    <ArrowUpRight className="h-4.5 w-4.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                      {isInbound ? "IN" : "OUT"}
                    </span>
                    <p className="text-[13px] font-semibold text-[#0f172a] truncate">
                      {isInbound ? "Inbound" : "Outbound"} #{order.id.slice(0, 8)}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    {order.quantity.toLocaleString()} units ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>

                <div className="shrink-0">
                  {isInbound ? (
                    <InboundOrderStatusBadge status={order.status as OrderStatus} />
                  ) : (
                    <OutboundOrderStatusBadge status={order.status as OutboundOrderStatus} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc]">
          <h4 className="text-xs font-bold text-[#0f172a]">No orders yet</h4>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Inbound and outbound orders will appear here.
          </p>
        </div>
      )}

      <div className="mt-4 border-t border-[#f1f5f9] pt-3 flex items-center justify-between text-[11px]">
        <span className="text-[#64748b]">Latest {orders.length} orders</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => (window.location.href = "/inbound")}
            className="font-semibold text-[#2457e6] hover:underline flex items-center gap-1"
          >
            Inbound <ArrowUpRight className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "/outbound")}
            className="font-semibold text-[#2457e6] hover:underline flex items-center gap-1"
          >
            Outbound <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </section>
  );
}
