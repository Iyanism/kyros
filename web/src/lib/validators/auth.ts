import { z } from "zod";
import { clientPhoneSchema } from "./client";

export const userPhoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Enter a valid phone number (e.g. 9823198456)"),
  );

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  email: z.email("Enter a valid business email"),
  phone_number: clientPhoneSchema,
  address: z.string().min(3, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pin_code: z.number().min(100000, "Enter a valid 6 digit pin code").max(999999, "Enter a valid 6 digit pin code"),
  gstin: z.string().nullable().optional().transform((v) => v || null),
});

export const accountSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone_number: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v == null || v.trim() === "" ? null : v.replace(/[\s-]/g, "")))
    .pipe(z.union([z.null(), userPhoneSchema])),
  email: z.string().email("Enter a valid login email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  client: companySchema,
  user: accountSchema,
});