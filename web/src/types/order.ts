import type { ChamberCategory } from "./chamber";

export type OrderStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "in_transit"
  | "arrived"
  | "processing"
  | "stored";

export interface OrderItemCreate {
  product_name: string;
  quantity: number;
  temperature_category: ChamberCategory;
  batch_number: string;
  expiry_date: string;
}

export interface OrderItemResponse {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  temperature_category: ChamberCategory;
  batch_number: string;
  expiry_date: string;
}

export interface InboundOrderRequest {
  client_id: string;
  vehicle_number: string;
  total_quantity: number;
  items: OrderItemCreate[];
}

export interface InboundOrderUpdate {
  vehicle_number?: string;
  total_quantity?: number;
}

export interface InboundOrderResponse {
  id: string;
  client_id: string;
  client_name: string;
  vehicle_number: string;
  total_quantity: number;
  status: OrderStatus;
  items: OrderItemResponse[];
  created_at: string;
  updated_at: string;
}
