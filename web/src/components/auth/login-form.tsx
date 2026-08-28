import { useState, type SubmitEventHandler } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowRight, ChevronLeft, Mail } from "lucide-react";

import { KyrosLogo } from "@/components/shared/logo";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { LoginRequest } from "@/types/auth";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { login } = useAuth();
  const [loginForm, setLoginForm] = useState<LoginRequest>({ email: "", password: "" });
  const navigate = useNavigate()

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      await login(loginForm);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#fbfcfe] px-7 py-8 sm:px-12 sm:py-10 lg:px-14 lg:py-11">
      <div className="">
        <Link to="/" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
            <ChevronLeft/> Go Back
          </Link>
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-[#8792a3]">
        <span className="lg:hidden">
          <KyrosLogo dark />
        </span>
      </div>

      <div className="relative flex flex-1 items-center py-12">
        <div className="relative z-10 w-full max-w-101.25 animate-fade-up lg:mx-auto">
          <div className="mb-9">
            <h2 className="font-display text-[clamp(2rem,4vw,2.7rem)] font-semibold leading-none tracking-[-0.07em] text-[#13213a]">
              Welcome back
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
              Sign in to check your goods, requests, and invoices.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField label="Email address" htmlFor="email">
              <Input
                id="email"
                size="lg"
                type="email"
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="you@company.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </FormField>

            <FormField label="Password" htmlFor="password">
              <PasswordInput
                id="password"
                size="lg"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </FormField>

            <div className="flex items-center justify-between gap-4 text-[12px]">
              <div className="flex items-center gap-2 text-[#66748a]">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-[12px] font-normal text-[#66748a]">
                  Remember me
                </Label>
              </div>
              <Link to="/forgot-password" className="font-semibold text-primary transition hover:text-primary-hover">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" className="group flex w-full items-center justify-center gap-2">
              Log in
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </form>

          <div className="mt-8 border-t border-[#e7ebf2] pt-6 text-center text-[12px] text-[#8994a5]">
            Don't have a Kyros account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
              Register your company
            </Link>
          </div>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}