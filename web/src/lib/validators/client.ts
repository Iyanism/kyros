import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email"),
  phone_number: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().min(3, "Address required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  pin_code: z.coerce.number().int("PIN must be integer").min(100000, "PIN must be 6 digits").max(999999, "PIN must be 6 digits"),
  gstin: z.string().optional().nullable().transform((v) => (v === "" ? null : v)),
});

export type ClientFormData = z.infer<typeof clientSchema>;
