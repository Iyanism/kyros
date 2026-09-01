import type { UserResponse } from "@/types/user";
import type { UserRole } from "@/types/user";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;

  setSession: (token: string, user: UserResponse) => void;
  clearSession: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function isSessionValid(): boolean {
  const { accessToken, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !accessToken) return false;
  return !isTokenExpired(accessToken);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setSession: (accessToken, user) =>
        set({ accessToken, user, isAuthenticated: true }),

      clearSession: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),

      hasRole: (roles) => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return false;
        const allowed = Array.isArray(roles) ? roles : [roles];
        return allowed.includes(user.role);
      },
    }),
    {
      name: "kyros-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && isTokenExpired(state.accessToken)) {
          state.clearSession();
        }
      },
    }
  )
);
