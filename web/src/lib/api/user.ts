import type { UserClientResponse, UserInfo } from "@/types/user";
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