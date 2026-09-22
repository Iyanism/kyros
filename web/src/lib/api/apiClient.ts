import axios from "axios";
import { env } from "@/config/env";

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem("kyros-auth-storage");
      } catch {
        // ignore
      }
    }
    return Promise.reject(error);
  }
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
