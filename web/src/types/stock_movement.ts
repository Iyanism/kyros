export type MovementType = "inbound" | "outbound" | "adjustment";
export type TemperatureCategory = "deep_freeze" | "chilled" | "ambient";

export interface StockMovementResponse {
  id: string;
  pallet_id: string;
  pallet_code: string;
  product_name: string;
  batch_code: string;
  slot_id: string;
  slot_code: string;
  movement_type: MovementType;
  quantity: number;
  weight_mt: number;
  reference_order_id: string | null;
  executed_by_user_id: string | null;
  temperature_category: TemperatureCategory;
  created_at: string;
}

export interface StockLevelResponse {
  id: string;
  pallet_id: string;
  pallet_code: string;
  product_name: string;
  batch_code: string;
  slot_id: string;
  slot_code: string;
  chamber_code: string;
  temperature_category: TemperatureCategory;
  quantity: number;
  weight_mt: number;
  updated_at: string;
}
