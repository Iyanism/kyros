import { apiClient } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
} from "@/types/auth";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function register(
  payload: RegistrationRequest
): Promise<RegistrationResponse> {
  const { data } = await apiClient.post<RegistrationResponse>("/auth/register", payload);
  return data;
}