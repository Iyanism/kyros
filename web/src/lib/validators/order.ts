import { z } from "zod";

export const orderItemSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  temperature_category: z.enum(["frozen", "chilled", "ambient"], {
    message: "Temperature category must be frozen, chilled, or ambient",
  }),
  batch_number: z.string().trim().min(1, "Batch number is required"),
  expiry_date: z.string().trim().min(1, "Expiry date is required"),
});

export const inboundOrderSchema = z.object({
  client_id: z.string().trim().min(1, "Please select or specify a client"),
  vehicle_number: z.string().trim().min(2, "Vehicle number is required"),
  total_quantity: z.coerce.number().nonnegative("Total quantity must be 0 or greater"),
  items: z.array(orderItemSchema).min(1, "At least one item is required in the inbound order"),
});

export type InboundOrderFormData = z.infer<typeof inboundOrderSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
