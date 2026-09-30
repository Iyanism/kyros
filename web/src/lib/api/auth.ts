import type { UserResponse } from "@/types/user";
import { apiClient } from "./apiClient";
import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
  RegistrationResponse,
} from "@/types/auth";

export async function login_user(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function register_user(
  payload: RegistrationRequest,
): Promise<RegistrationResponse> {
  const { data } = await apiClient.post<RegistrationResponse>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function getCurrentUser(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>("/auth/me");
  return data;
}

export async function refreshToken(): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/refresh");
  return data;
}

// Single-flight refresh so parallel 401s only trigger one /auth/refresh call
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshToken()
      .then((data) => data.access_token)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

