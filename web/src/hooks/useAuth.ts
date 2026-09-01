import { login_user, register_user } from "@/lib/api/auth";
import { loginSchema } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/authStore";
import type { LoginRequest, LoginResponse, RegistrationRequest } from "@/types/auth";

export function useAuth() {
  const { accessToken, user, isAuthenticated, setSession, clearSession, hasRole } =
    useAuthStore();

  async function login(payload: LoginRequest) {
    const parsed = loginSchema.parse(payload);
    const response: LoginResponse = await login_user(parsed);
    setSession(response.access_token, response.user);
    return response;
  }

  function logout() {
    clearSession();
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
