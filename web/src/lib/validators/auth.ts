import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  email: z.email("Enter a valid business email"),
  phone_number: z.string().min(10, "Enter a valid phone number"),
  address: z.string().min(3, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pin_code: z.string().regex(/^\d{6}$/, "PIN code must be exactly 6 digits"),
  gstin: z.string().optional(),
});

export const accountSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone_number: z.string().optional(),
  email: z.email("Enter a valid login email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  company: companySchema,
  account: accountSchema,
});