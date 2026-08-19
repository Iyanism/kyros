import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterBrandPanel } from "@/components/auth/register-brand-panel";
import { RegistrationForm } from "@/components/auth/registration-form";

export function Register() {
  return <AuthLayout left={<RegisterBrandPanel />} right={<RegistrationForm />} leftWidth="w-[45%]" />;
}