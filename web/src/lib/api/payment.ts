import type {
  ConfirmPaymentRequest,
  CreatePaymentRequest,
  PaymentDetailResponse,
} from "@/types/payment";
import { apiClient } from "./apiClient";

export async function create_payment(
  payload: CreatePaymentRequest
): Promise<PaymentDetailResponse> {
  const { data } = await apiClient.post<PaymentDetailResponse>("/payments", payload);
  return data;
}

export async function confirm_payment(
  payment_id: string,
  payload: ConfirmPaymentRequest
): Promise<PaymentDetailResponse> {
  const { data } = await apiClient.post<PaymentDetailResponse>(
    `/payments/${payment_id}/confirm`,
    payload
  );
  return data;
}

export async function get_payments(): Promise<PaymentDetailResponse[]> {
  const { data } = await apiClient.get<PaymentDetailResponse[]>("/payments");
  return data;
}

export async function get_payment_by_invoice(
  invoice_id: string
): Promise<PaymentDetailResponse> {
  const { data } = await apiClient.get<PaymentDetailResponse>(
    `/payments/invoice/${invoice_id}`
  );
  return data;
}

export async function refund_payment(
  payment_id: string
): Promise<PaymentDetailResponse> {
  const { data } = await apiClient.post<PaymentDetailResponse>(
    `/payments/${payment_id}/refund`
  );
  return data;
}

export async function download_payment_receipt(
  payment_id: string,
  receipt_number: string | null = null
): Promise<void> {
  const response = await apiClient.get(`/payments/${payment_id}/receipt`, {
    responseType: "blob",
  });

  const filename = receipt_number ? `${receipt_number}.pdf` : `Receipt-${payment_id.slice(0, 8)}.pdf`;
  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
