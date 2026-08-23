import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
  UserResponse,
} from "@/types/auth";

export async function login_user(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function register_user(
  payload: RegistrationRequest
): Promise<RegistrationResponse> {
  const { data } = await apiClient.post<RegistrationResponse>("/auth/register", payload);
  return data;
}

export async function getCurrentUser(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>("/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}