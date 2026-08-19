import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  IdCard,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { FormSectionHeader } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthFooter } from "@/components/auth/auth-footer";
import { register } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { registerSchema } from "@/lib/validators/auth";

export function RegistrationForm() {
  const navigate = useNavigate();
  const [company, setCompany] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    gstin: "",
  });
  const [account, setAccount] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const parsed = registerSchema.safeParse({ company, account });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the highlighted fields.");
      return;
    }

    try {
      await register({
        client: {
          name: parsed.data.company.name,
          email: parsed.data.company.email,
          phone_number: parsed.data.company.phone_number,
          address: parsed.data.company.address,
          city: parsed.data.company.city,
          state: parsed.data.company.state,
          pin_code: Number(parsed.data.company.pin_code),
          gstin: parsed.data.company.gstin || null,
        },
        user: {
          email: parsed.data.account.email,
          password_hash: parsed.data.account.password,
          full_name: parsed.data.account.full_name,
          phone_number: parsed.data.account.phone_number || null,
        },
      });
      navigate("/login");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-[#fbfcfe] px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-8">
      <div className="flex shrink-0 items-center justify-between text-[11px] font-medium text-[#8792a3]">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-1.5 transition hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to login
        </button>
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
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Business email" htmlFor="company-email">
                  <Input
                    id="company-email"
                    type="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    placeholder="ops@meridianfoods.in"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  />
                </FormField>

                <FormField label="Company phone" htmlFor="company-phone">
                  <Input
                    id="company-phone"
                    type="tel"
                    leftIcon={<Phone className="h-4 w-4" />}
                    placeholder="+91 98765 43210"
                    value={company.phone_number}
                    onChange={(e) => setCompany({ ...company, phone_number: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Street address" htmlFor="company-address">
                <Input
                  id="company-address"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  placeholder="4th Floor, Fancy Bazaar Road"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </FormField>

              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="City" htmlFor="company-city">
                  <Input
                    id="company-city"
                    placeholder="Guwahati"
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  />
                </FormField>

                <FormField label="State" htmlFor="company-state">
                  <Input
                    id="company-state"
                    placeholder="Assam"
                    value={company.state}
                    onChange={(e) => setCompany({ ...company, state: e.target.value })}
                  />
                </FormField>

                <FormField label="PIN code" htmlFor="company-pin">
                  <Input
                    id="company-pin"
                    placeholder="781001"
                    value={company.pin_code}
                    onChange={(e) => setCompany({ ...company, pin_code: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="GSTIN (optional)" htmlFor="company-gstin">
                <Input
                  id="company-gstin"
                  leftIcon={<IdCard className="h-4 w-4" />}
                  placeholder="18AAAAA0000A1Z5"
                  value={company.gstin}
                  onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
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
                    value={account.full_name}
                    onChange={(e) => setAccount({ ...account, full_name: e.target.value })}
                  />
                </FormField>

                <FormField label="Your work phone" htmlFor="account-phone">
                  <Input
                    id="account-phone"
                    type="tel"
                    leftIcon={<Phone className="h-4 w-4" />}
                    placeholder="+91 98765 43210"
                    value={account.phone_number}
                    onChange={(e) => setAccount({ ...account, phone_number: e.target.value })}
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
                  value={account.email}
                  onChange={(e) => setAccount({ ...account, email: e.target.value })}
                />
              </FormField>

              <FormField label="Password" htmlFor="account-password">
                <PasswordInput
                  id="account-password"
                  placeholder="At least 8 characters"
                  value={account.password}
                  onChange={(e) => setAccount({ ...account, password: e.target.value })}
                />
              </FormField>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-[11px] font-normal leading-4 text-[#66748a]">
                I agree to the{" "}
                <button type="button" className="font-semibold text-primary hover:text-primary-hover">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="font-semibold text-primary hover:text-primary-hover">
                  Privacy Policy
                </button>
              </Label>
            </div>

            <Button type="submit" className="group flex w-full items-center justify-center gap-2">
              Create company & account
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </form>

          <div className="mt-4 border-t border-[#e7ebf2] pt-4 text-center text-[11px] text-[#8994a5]">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/")} className="font-semibold text-primary hover:text-primary-hover">
              Sign in
            </button>
          </div>
        </div>
      </div>

      <AuthFooter className="pt-3" />
    </div>
  );
}