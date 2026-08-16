import type { ClientCreate, ClientResponse } from "./client";

export type UserRole = "admin" | "operator" | "client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  client_id: string | null;
  email: string;
  role: UserRole;
}

export interface RegisterUserInfo {
  email: string;
  password_hash: string;
  full_name: string;
  phone_number?: string | null;
}

export interface RegistrationRequest {
  client: ClientCreate;
  user: RegisterUserInfo;
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

export interface RegistrationResponse {
  login_info: LoginResponse;
  user: UserResponse;
  client: ClientResponse;
}