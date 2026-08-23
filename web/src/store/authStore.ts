import { create } from "zustand";
import type { LoginResponse, UserResponse, UserRole } from "@/types/auth";
import { getCurrentUser } from "@/lib/api/auth";

const ACCESS_TOKEN_KEY = "kyros.access_token";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  clientId: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (payload: LoginResponse) => void;
  clearSession: () => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  user: null,
  isAuthenticated: Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)),
  setSession: (payload) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
    set({
      accessToken: payload.access_token,
      user: {
        id: payload.user_id,
        email: payload.email,
        role: payload.role,
        clientId: payload.client_id,
      },
      isAuthenticated: true,
    });
  },
  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ accessToken: null, user: null, isAuthenticated: false });
  },
  restoreSession: async (): Promise<void> => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      try {
        const userResponse: UserResponse = await getCurrentUser();
        set({
          accessToken,
          user: {
            id: userResponse.id,
            email: userResponse.email,
            role: userResponse.role,
            clientId: userResponse.client_id,
          },
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        set({ accessToken: null, user: null, isAuthenticated: false });
      }
    }
  },
}));