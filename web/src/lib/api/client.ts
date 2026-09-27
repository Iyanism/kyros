import type { ClientCreate, ClientResponse, ClientUpdate } from "@/types/client";
import { apiClient } from "./apiClient";


export async function get_clients(): Promise<ClientResponse[]>{
    const { data } = await apiClient.get<ClientResponse[]>("/clients")
    return data
}

export async function get_client(client_id: string): Promise<ClientResponse> {
    const { data } = await apiClient.get<ClientResponse>(`/clients/${client_id}`)
    return data
}

export async function create_client(payload: ClientCreate): Promise<ClientResponse> {
    const { data } = await apiClient.post<ClientResponse>("/clients", payload)
    return data
}

export async function toggle_client_status(client_id: string): Promise<ClientResponse> {
    const { data } = await apiClient.patch<ClientResponse>(`/clients/${client_id}/status`)
    return data
}

export async function update_client(client_id: string, payload: ClientUpdate): Promise<ClientResponse> {
    const { data } = await apiClient.patch<ClientResponse>(`/clients/${client_id}`, payload)
    return data
}

export async function delete_client(client_id: string): Promise<void> {
    await apiClient.delete(`/clients/${client_id}`)
}