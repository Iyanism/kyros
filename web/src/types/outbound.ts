export type OutboundOrderStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "dispatched";

export interface OutboundOrderItemResponse {
  id: string;
  outbound_order_id: string;
  product_name: string;
  quantity: number;
}

export interface OutboundOrderResponse {
  id: string;
  client_id: string;
  client_name: string;
  total_quantity: number;
  status: OutboundOrderStatus;
  items: OutboundOrderItemResponse[];
  created_at: string;
  updated_at: string;
}

export interface OutboundOrderItemCreate {
  product_name: string;
  quantity: number;
}

export interface OutboundOrderCreate {
  client_id: string;
  total_quantity: number;
  items: OutboundOrderItemCreate[];
}

export interface OutboundOrderStatusUpdate {
  status: OutboundOrderStatus;
}
