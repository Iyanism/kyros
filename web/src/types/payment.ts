export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export interface CreatePaymentRequest {
  invoice_id: string;
  method: PaymentMethod;
}

export interface ConfirmPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentResponse {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  receipt_number: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentDetailResponse extends PaymentResponse {
  invoice_number: string;
  client_name: string;
  client_id: string | null;
}
