import type { ClientCreate, ClientResponse } from "./client";
import type { UserResponse, UserRole } from "./user";

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

export interface RegistrationResponse {
  login_info: LoginResponse;
  user: UserResponse;
  client: ClientResponse;
}