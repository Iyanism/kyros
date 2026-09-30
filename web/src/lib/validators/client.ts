import { z } from "zod";

export const clientPhoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"));

export const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email"),
  phone_number: clientPhoneSchema,
  address: z.string().min(3, "Address required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  pin_code: z.coerce.number().int("PIN must be integer").min(100000, "PIN must be 6 digits").max(999999, "PIN must be 6 digits"),
  gstin: z.string().optional().nullable().transform((v) => (v === "" ? null : v)),
});

export type ClientFormData = z.infer<typeof clientSchema>;
