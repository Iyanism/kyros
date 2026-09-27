import type {
  ClientInventorySummary,
  PalletItemResponse,
  PalletisationResult,
  PalletResponse,
  PickListResponse,
  SlotAllocationResponse,
} from "@/types/inventory";
import { apiClient } from "./apiClient";

export async function get_all_inventory(): Promise<PalletItemResponse[]> {
  const { data } = await apiClient.get<PalletItemResponse[]>("/inventory/inventory");
  return data;
}

export async function get_client_inventory(client_id: string): Promise<PalletItemResponse[]> {
  const { data } = await apiClient.get<PalletItemResponse[]>(
    `/inventory/clients/${client_id}/inventory`
  );
  return data;
}

export async function get_client_inventory_summary(
  client_id: string
): Promise<ClientInventorySummary[]> {
  const { data } = await apiClient.get<ClientInventorySummary[]>(
    `/inventory/clients/${client_id}/inventory/summary`
  );
  return data;
}

export async function palletise_order(order_id: string): Promise<PalletisationResult> {
  const { data } = await apiClient.post<PalletisationResult>(
    `/inventory/orders/${order_id}/pallets`
  );
  return data;
}

export async function list_order_pallets(order_id: string): Promise<PalletResponse[]> {
  const { data } = await apiClient.get<PalletResponse[]>(
    `/inventory/orders/${order_id}/pallets`
  );
  return data;
}

export async function allocate_order(
  order_id: string,
  chamber_id: string | null = null
): Promise<SlotAllocationResponse[]> {
  const { data } = await apiClient.post<SlotAllocationResponse[]>(
    `/inventory/orders/${order_id}/allocate`,
    { chamber_id }
  );
  return data;
}

export async function list_order_allocations(
  order_id: string
): Promise<SlotAllocationResponse[]> {
  const { data } = await apiClient.get<SlotAllocationResponse[]>(
    `/inventory/orders/${order_id}/allocations`
  );
  return data;
}

export async function generate_pick_list(
  outbound_order_id: string
): Promise<PickListResponse> {
  const { data } = await apiClient.post<PickListResponse>("/inventory/pick-list", {
    outbound_order_id,
  });
  return data;
}

export async function get_pick_list_by_outbound_order(
  outbound_order_id: string
): Promise<PickListResponse> {
  const { data } = await apiClient.get<PickListResponse>(
    `/inventory/pick-lists/outbound/${outbound_order_id}`
  );
  return data;
}

export async function get_pick_list(pick_list_id: string): Promise<PickListResponse> {
  const { data } = await apiClient.get<PickListResponse>(
    `/inventory/pick-lists/${pick_list_id}`
  );
  return data;
}


