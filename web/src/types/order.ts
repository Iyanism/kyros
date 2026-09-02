export interface InboundOrderRequest {
  client_id: string;
  vehicle_number: string;
  total_quantity: number;
  items: OrderItem[];
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit: "kg" | "lb" | "g" | "oz";
  batch_number?: string | null;
  expiry_date?: string | null;
}

export type OrderStatus = "pending" | "received" | "inspecting" | "stored" | "cancelled";

export interface InboundOrderResponse extends InboundOrderRequest {
  id: string;
  order_number: string;
  client_name: string;
  status: OrderStatus;
  received_at: string;
  created_at: string;
  updated_at: string;
  notes?: string | undefined;
}
