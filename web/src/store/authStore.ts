// store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  isLoading: boolean;
  error: string | null;
  setSession: (payload: LoginResponse) => void;
  clearSession: () => void;
  restoreSession: () => Promise<boolean>;
  resetError: () => void;
}

// Helper to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // If can't parse, treat as expired
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setSession: (payload: LoginResponse) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
        set({
          accessToken: payload.access_token,
          user: {
            id: payload.user_id,
            email: payload.email,
            role: payload.role,
            clientId: payload.client_id ?? null,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      clearSession: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      restoreSession: async (): Promise<boolean> => {
        const { clearSession } = get();
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return false;
        }

        // Check if token is expired locally
        if (isTokenExpired(token)) {
          console.warn("Token expired locally");
          clearSession();
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const userResponse: UserResponse = await getCurrentUser();
          
          set({
            accessToken: token,
            user: {
              id: userResponse.id,
              email: userResponse.email,
              role: userResponse.role,
              clientId: userResponse.client_id ?? null,
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return true;
        } catch (error: any) {
          console.error("Failed to restore session:", error);
          
          // Handle different error types
          let errorMessage = "Session restoration failed";
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            errorMessage = "Session expired. Please login again.";
            clearSession();
          } else if (error?.response?.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
            errorMessage = "Request timeout. Please check your connection.";
          } else if (error?.message?.includes("network")) {
            errorMessage = "Network error. Please check your internet connection.";
          }

          set({
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          return false;
        }
      },

      resetError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for cleaner component usage
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.setSession,
    logout: store.clearSession,
    restoreSession: store.restoreSession,
    resetError: store.resetError,
  };
};