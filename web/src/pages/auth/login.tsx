import { AuthLayout } from "@/components/auth/auth-layout";
import { BrandPanel } from "@/components/auth/brand-panel";
import { LoginForm } from "@/components/auth/login-form";

export function Login() {
  return <AuthLayout left={<BrandPanel />} right={<LoginForm />} leftWidth="w-[54%]" />;
}