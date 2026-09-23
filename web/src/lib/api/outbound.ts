import type {
  OutboundOrderCreate,
  OutboundOrderResponse,
  OutboundOrderStatus,
} from "@/types/outbound";
import { apiClient } from "./apiClient";

export async function get_outbound_orders(): Promise<OutboundOrderResponse[]> {
  const { data } = await apiClient.get<OutboundOrderResponse[]>("/outbound-orders");
  return data;
}

export async function get_outbound_order(order_id: string): Promise<OutboundOrderResponse> {
  const { data } = await apiClient.get<OutboundOrderResponse>(`/outbound-orders/${order_id}`);
  return data;
}

export async function create_outbound_order(
  payload: OutboundOrderCreate
): Promise<OutboundOrderResponse> {
  const { data } = await apiClient.post<OutboundOrderResponse>("/outbound-orders", payload);
  return data;
}

export async function update_outbound_order_status(
  order_id: string,
  status: OutboundOrderStatus
): Promise<OutboundOrderResponse> {
  const { data } = await apiClient.patch<OutboundOrderResponse>(
    `/outbound-orders/${order_id}/status`,
    { status }
  );
  return data;
}

export async function delete_outbound_order(order_id: string): Promise<void> {
  await apiClient.delete(`/outbound-orders/${order_id}`);
}
