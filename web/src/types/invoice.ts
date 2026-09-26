export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid";

export interface InvoiceLineItemResponse {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_rate_snapshot: number;
  total_price: number;
}

export interface InvoiceResponse {
  id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  cgst_rate: number | null;
  cgst_amount: number | null;
  sgst_rate: number | null;
  sgst_amount: number | null;
  igst_rate: number | null;
  igst_amount: number | null;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  due_date: string;
  viewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceDetailResponse extends InvoiceResponse {
  line_items: InvoiceLineItemResponse[];
  client_name: string;
  client_address: string;
  client_gstin: string | null;
  client_state: string;
}

export interface GenerateInvoiceRequest {
  client_id: string;
  billing_period_start: string;
  billing_period_end: string;
  storage_daily_rate: number;
  handling_rate: number;
}

export interface UpdateInvoiceStatusRequest {
  status: InvoiceStatus;
}
