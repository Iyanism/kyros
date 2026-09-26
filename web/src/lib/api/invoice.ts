import type {
  GenerateInvoiceRequest,
  InvoiceDetailResponse,
  InvoiceStatus,
} from "@/types/invoice";
import { apiClient } from "./apiClient";

export async function get_invoices(): Promise<InvoiceDetailResponse[]> {
  const { data } = await apiClient.get<InvoiceDetailResponse[]>("/invoices");
  return data;
}

export async function get_invoice(invoice_id: string): Promise<InvoiceDetailResponse> {
  const { data } = await apiClient.get<InvoiceDetailResponse>(`/invoices/${invoice_id}`);
  return data;
}

export async function get_client_invoices(
  client_id: string
): Promise<InvoiceDetailResponse[]> {
  const { data } = await apiClient.get<InvoiceDetailResponse[]>(
    `/invoices/client/${client_id}`
  );
  return data;
}

export async function generate_invoice(
  payload: GenerateInvoiceRequest
): Promise<InvoiceDetailResponse> {
  const { data } = await apiClient.post<InvoiceDetailResponse>(
    "/invoices/generate",
    payload
  );
  return data;
}

export async function update_invoice_status(
  invoice_id: string,
  status: InvoiceStatus
): Promise<InvoiceDetailResponse> {
  const { data } = await apiClient.patch<InvoiceDetailResponse>(
    `/invoices/${invoice_id}/status`,
    { status }
  );
  return data;
}

export async function download_invoice_pdf(
  invoice_id: string,
  invoice_number: string
): Promise<void> {
  const response = await apiClient.get(`/invoices/${invoice_id}/pdf`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${invoice_number}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
