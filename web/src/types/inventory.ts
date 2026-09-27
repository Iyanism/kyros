import type { ChamberCategory } from "./chamber";

export type PalletStatus = "allocated" | "stored" | "dispatched" | "pending" | "picked" | "reserved";

export interface PalletResponse {
  id: string;
  order_id: string;
  order_item_id: string | null;
  client_id: string;
  pallet_code: string;
  product_name: string | null;
  batch_code: string;
  expiry_date: string;
  temperature_category: ChamberCategory;
  weight: number;
  quantity: number;
  is_partial: boolean;
  status: PalletStatus;
  created_at: string;
  updated_at: string;
}

export interface PalletItemResponse {
  id: string;
  pallet_code: string;
  product_name: string;
  batch_code: string;
  expiry_date: string;
  temperature_category: ChamberCategory;
  quantity: number;
  weight: number;
  is_partial: boolean;
  status: string;
  slot_code: string;
  chamber_code: string;
  chamber_name: string;
  rack_number: string;
  created_at: string;
  updated_at: string;
}

export interface ClientInventorySummary {
  product_name: string;
  batch_code: string;
  expiry_date: string;
  temperature_category: ChamberCategory;
  total_quantity: number;
  total_weight_mt: number;
  pallet_count: number;
}

export interface PalletisationResult {
  order_id: string;
  total_pallets: number;
  total_weight_mt: number;
  pallets: PalletResponse[];
}

export interface SlotAllocationResponse {
  id: string;
  order_id: string;
  pallet_id: string;
  slot_id: string;
  pallet_code: string;
  temperature_category: ChamberCategory;
  slot_code: string;
  allocated_at: string;
}

export interface PickRecordResponse {
  id: string;
  pallet_id: string;
  pallet_code: string;
  product_name: string;
  batch_code: string;
  quantity: number;
  weight: number;
  slot_code: string;
  picked: boolean;
  picked_at: string | null;
}

export interface PickListResponse {
  id: string;
  outbound_order_id: string;
  total_lines: number;
  total_quantity: number;
  total_weight_mt: number;
  records: PickRecordResponse[];
  created_at: string;
}


