import type { StockLevelResponse, StockMovementResponse } from "@/types/stock_movement";
import { apiClient } from "./apiClient";

export async function get_stock_levels(): Promise<StockLevelResponse[]> {
  const { data } = await apiClient.get<StockLevelResponse[]>("/stock-movements/levels");
  return data;
}

export async function get_stock_levels_by_client(clientId: string): Promise<StockLevelResponse[]> {
  const { data } = await apiClient.get<StockLevelResponse[]>(`/stock-movements/levels/client/${clientId}`);
  return data;
}

export async function get_stock_movements(): Promise<StockMovementResponse[]> {
  const { data } = await apiClient.get<StockMovementResponse[]>("/stock-movements/movements");
  return data;
}

export async function get_stock_movements_by_client(clientId: string): Promise<StockMovementResponse[]> {
  const { data } = await apiClient.get<StockMovementResponse[]>(`/stock-movements/movements/client/${clientId}`);
  return data;
}
