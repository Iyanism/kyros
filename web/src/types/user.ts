import type { ClientResponse } from "./client";

export type UserRole = "admin" | "operator" | "client";

export interface UserInfo {
  email: string;
  password: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  client_id: string | null;
}

export interface UserResponse {
  id: string;
  client_id: string | null;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserClientResponse extends UserResponse {
  client: ClientResponse | null;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  full_name?: string;
  phone_number?: string | null;
  role?: UserRole;
  client_id?: string | null;
  is_active?: boolean;
}