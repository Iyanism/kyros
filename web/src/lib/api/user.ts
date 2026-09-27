import type { UserClientResponse, UserInfo, UserResponse, UserUpdate } from "@/types/user";
import { apiClient } from "./apiClient";


export async function create_user(payload: UserInfo): Promise<UserClientResponse> {
    const { data } = await apiClient.post<UserClientResponse>("/users", payload);
    return data;
}

export async function get_users(): Promise<UserClientResponse[]> {
    const { data } = await apiClient.get<UserClientResponse[]>("/users");
    return data;
}

export async function toggle_status(user_id: string): Promise<UserClientResponse> {
    const { data } = await apiClient.patch<UserClientResponse>(`/users/${user_id}/status`);
    return data;
}

export async function update_user(user_id: string, payload: UserUpdate): Promise<UserResponse> {
    const { data } = await apiClient.patch<UserResponse>(`/users/${user_id}`, payload);
    return data;
}

export async function delete_user(user_id: string): Promise<void> {
    await apiClient.delete(`/users/${user_id}`);
}