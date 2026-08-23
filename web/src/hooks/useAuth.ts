import { login_user, register_user } from "@/lib/api/auth";
import { loginSchema } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/authStore";
import type { LoginRequest, LoginResponse, RegistrationRequest } from "@/types/auth";

export function useAuth(){
    const { accessToken, user, isAuthenticated, setSession, clearSession } = useAuthStore();

    async function login(payload: LoginRequest) {
        const parsedPayload = loginSchema.parse(payload);
        const response: LoginResponse = await login_user(parsedPayload);
        setSession(response);
        return response;
    }

    async function logout() {
        clearSession();
    }

    async function register(payload: RegistrationRequest){
        const response = await register_user(payload)
        setSession(response.login_info)
        return response
    }
    return {
        accessToken,
        user,
        isAuthenticated,
        setSession,
        clearSession,
        login,
        logout,
        register
    }
}