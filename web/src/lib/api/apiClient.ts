import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { refreshAccessToken } from "./auth";

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("kyros-auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed.state?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { __retried?: boolean };

function endSession(): void {
  useAuthStore.getState().clearSession();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const config = error.config as RetriableRequestConfig | undefined;
    // Public auth calls (bad credentials / failed registration) must not trigger
    // a refresh attempt or a forced logout redirect.
    const isPublicAuthCall =
      config?.url === "/auth/login" ||
      config?.url === "/auth/register" ||
      config?.url === "/auth/refresh";

    if (
      error.response?.status === 401 &&
      config &&
      !config.__retried &&
      !isPublicAuthCall
    ) {
      config.__retried = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        useAuthStore.setState({ accessToken: newToken });
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }

      endSession();
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (detail && typeof detail === "object" && typeof detail.message === "string") {
      return detail.message;
    }
    if (typeof detail === "string") {
      return detail;
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
