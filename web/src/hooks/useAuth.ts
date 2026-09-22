import { getCurrentUser, login_user, logout as apiLogout, register_user } from "@/lib/api/auth";
import { loginSchema } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/authStore";
import type { LoginRequest, LoginResponse, RegistrationRequest } from "@/types/auth";

export function useAuth() {
  const { accessToken, user, isAuthenticated, setSession, clearSession, hasRole } =
    useAuthStore();

  async function login(payload: LoginRequest) {
    const parsed = loginSchema.parse(payload);
    const response: LoginResponse = await login_user(parsed);
    const currentUser = await getCurrentUser();
    setSession(response.access_token, currentUser);
    return response;
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // Ignore API logout errors if token is already expired
    } finally {
      clearSession();
    }
  }

  async function register(payload: RegistrationRequest) {
    const response = await register_user(payload);
    setSession(response.login_info.access_token, response.user);
    return response;
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    hasRole,
    setSession,
    clearSession,
    login,
    logout,
    register,
  };
}

