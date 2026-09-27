import type {
  InboundOrderRequest,
  InboundOrderResponse,
  InboundOrderUpdate,
  OrderStatus,
} from "@/types/order";
import { apiClient } from "./apiClient";

export async function get_inbound_orders(): Promise<InboundOrderResponse[]> {
  const { data } = await apiClient.get<InboundOrderResponse[]>("/inbound-orders");
  return data;
}

export async function get_inbound_order(order_id: string): Promise<InboundOrderResponse> {
  const { data } = await apiClient.get<InboundOrderResponse>(`/inbound-orders/${order_id}`);
  return data;
}

export async function get_inbound_orders_by_client(
  client_id: string
): Promise<InboundOrderResponse[]> {
  const { data } = await apiClient.get<InboundOrderResponse[]>(
    `/inbound-orders/client/${client_id}`
  );
  return data;
}

export async function create_inbound_order(
  payload: InboundOrderRequest
): Promise<InboundOrderResponse> {
  const { data } = await apiClient.post<InboundOrderResponse>("/inbound-orders", payload);
  return data;
}

export async function update_inbound_order(
  order_id: string,
  payload: InboundOrderUpdate
): Promise<InboundOrderResponse> {
  const { data } = await apiClient.patch<InboundOrderResponse>(
    `/inbound-orders/${order_id}`,
    payload
  );
  return data;
}

export async function update_inbound_order_status(
  order_id: string,
  status: OrderStatus
): Promise<InboundOrderResponse> {
  const { data } = await apiClient.patch<InboundOrderResponse>(
    `/inbound-orders/${order_id}/status`,
    { status }
  );
  return data;
}

export async function delete_inbound_order(order_id: string): Promise<void> {
  await apiClient.delete(`/inbound-orders/${order_id}`);
}

