import type { InboundOrderRequest, InboundOrderResponse, OrderStatus } from "@/types/order";
import { MOCK_INBOUND_ORDERS } from "@/lib/data/order";
import { toast } from "sonner";

let localInboundOrders: InboundOrderResponse[] = [...MOCK_INBOUND_ORDERS];

export async function get_inbound_orders(): Promise<InboundOrderResponse[]> {
  return localInboundOrders;
}

export async function create_inbound_order(
  payload: InboundOrderRequest & { client_name?: string }
): Promise<InboundOrderResponse> {
  const newOrder: InboundOrderResponse = {
    id: `inb-${Date.now()}`,
    order_number: `INB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    client_id: payload.client_id,
    client_name: payload.client_name || payload.client_id,
    vehicle_number: payload.vehicle_number,
    total_quantity: payload.total_quantity,
    items: payload.items,
    status: "pending",
    received_at: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localInboundOrders = [newOrder, ...localInboundOrders];
  toast.success("Inbound order created");
  return newOrder;
}

export async function update_inbound_order_status(
  order_id: string,
  status: OrderStatus
): Promise<InboundOrderResponse> {
  const existing = localInboundOrders.find((o) => o.id === order_id);
  if (!existing) throw new Error("Order not found");
  const updated = { ...existing, status, updated_at: new Date().toISOString() };
  localInboundOrders = localInboundOrders.map((o) => (o.id === order_id ? updated : o));
  toast.success(`Order status updated to '${status}'`);
  return updated;
}

export async function delete_inbound_order(order_id: string): Promise<void> {
  localInboundOrders = localInboundOrders.filter((o) => o.id !== order_id);
  toast.success("Inbound order deleted");
}
