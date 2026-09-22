import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  IdCard,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { FormSectionHeader } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthFooter } from "@/components/auth/auth-footer";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { registerSchema } from "@/lib/validators/auth";
import { cn } from "@/lib/utils";
import type { RegisterUserInfo} from "@/types/auth";
import type { ClientCreate } from "@/types/client";
import { useAuth } from "@/hooks/useAuth";

export function RegistrationForm() {
  const navigate = useNavigate();
  const { register } = useAuth()
  const [client, setClient] = useState<ClientCreate>({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    pin_code: 0,
    gstin: "",
  });
  const [user, setUser] = useState<RegisterUserInfo>({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const parsed = registerSchema.safeParse({ client, user });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the highlighted fields.");
      return;
    }

    try {
      await register(parsed.data)
      navigate("/dashboard");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-[#fbfcfe] px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-8">
      <div className="flex shrink-0 items-center justify-between text-[11px] font-medium">
        <Link to="/" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
          <ChevronLeft /> Go Back
        </Link>
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#56657d] sm:block">
          Step 1 of 2
        </span>
      </div>

      <div className="flex flex-1 items-center overflow-y-auto py-3">
        <div className="mx-auto w-full max-w-145 animate-fade-up">
          <div className="mb-4">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-none tracking-[-0.07em] text-[#13213a]">
              Create your account
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
              We'll set up your company and your sign-in together — you'll be placing requests right after.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Company details */}
            <div className="space-y-3">
              <FormSectionHeader step={1} title="Company details" />

              <FormField label="Company name" htmlFor="company-name">
                <Input
                  id="company-name"
                  leftIcon={<Building2 className="h-4 w-4" />}
                  placeholder="Meridian Foods Pvt. Ltd."
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                />
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Business email" htmlFor="company-email">
                  <Input
                    id="company-email"
                    type="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    placeholder="ops@meridianfoods.in"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                  />
                </FormField>

                <FormField label="Company phone" htmlFor="company-phone">
                  <Input
                    id="company-phone"
                    type="tel"
                    leftIcon={<Phone className="h-4 w-4" />}
                    placeholder="+91 98765 43210"
                    value={client.phone_number}
                    onChange={(e) => setClient({ ...client, phone_number: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Street address" htmlFor="company-address">
                <Input
                  id="company-address"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  placeholder="4th Floor, Fancy Bazaar Road"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                />
              </FormField>

              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="City" htmlFor="company-city">
                  <Input
                    id="company-city"
                    placeholder="Guwahati"
                    value={client.city}
                    onChange={(e) => setClient({ ...client, city: e.target.value })}
                  />
                </FormField>

                <FormField label="State" htmlFor="company-state">
                  <Input
                    id="company-state"
                    placeholder="Assam"
                    value={client.state}
                    onChange={(e) => setClient({ ...client, state: e.target.value })}
                  />
                </FormField>

                <FormField label="PIN code" htmlFor="company-pin">
                  <Input
                    id="company-pin"
                    type="number"
                    placeholder="781001"
                    value={client.pin_code || ""}
                    onChange={(e) =>
                      setClient({
                        ...client,
                        pin_code: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                  />
                </FormField>
              </div>

              <FormField label="GSTIN (optional)" htmlFor="company-gstin">
                <Input
                  id="company-gstin"
                  leftIcon={<IdCard className="h-4 w-4" />}
                  placeholder="18AAAAA0000A1Z5"
                  value={client.gstin ?? ""}
                  onChange={(e) => setClient({ ...client, gstin: e.target.value })}
                />
              </FormField>
            </div>

            {/* Your account */}
            <div className="space-y-3 border-t border-[#e7ebf2] pt-4">
              <FormSectionHeader step={2} title="Your sign-in" />

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Your full name" htmlFor="account-name">
                  <Input
                    id="account-name"
                    leftIcon={<User className="h-4 w-4" />}
                    placeholder="Alesia Rahman"
                    value={user.full_name}
                    onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                  />
                </FormField>

                <FormField label="Your work phone" htmlFor="account-phone">
                  <Input
                    id="account-phone"
                    type="tel"
                    leftIcon={<Phone className="h-4 w-4" />}
                    placeholder="+91 98765 43210"
                    value={user.phone_number ?? ""}
                    onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField
                label="Login email"
                htmlFor="account-email"
                hint="Can be the same as your business email, or different — this is what you'll log in with."
              >
                <Input
                  id="account-email"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  placeholder="alesia@meridianfoods.in"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </FormField>

              <FormField label="Password" htmlFor="account-password">
                <PasswordInput
                  id="account-password"
                  placeholder="At least 8 characters"
                  value={user.password}
                  onChange={(e) => setUser({ ...user, password: e.target.value })}
                />
              </FormField>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-[11px] font-normal leading-4 text-[#66748a]">
                I agree to the{" "}
                <Link to={"#termsofservice"} type="button" className="font-semibold text-primary hover:text-primary-hover">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to={"#privacypolicy"} type="button" className="font-semibold text-primary hover:text-primary-hover">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button type="submit" className="group flex w-full items-center justify-center gap-2">
              Create company & account
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </form>

          <div className="mt-4 border-t border-[#e7ebf2] pt-4 text-center text-[11px] text-[#8994a5]">
            Already have an account?{" "}
            <Link to={"/login"} className="font-semibold text-primary hover:text-primary-hover">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <AuthFooter className="pt-3" />
    </div>
  );
}
