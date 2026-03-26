import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  type: z.enum(["DELIVERY", "PICKUP", "WILL_CALL", "TRANSFER", "RETURN_PICKUP", "VENDOR_DROP_SHIP"]),
  customerId: z.string().min(1),
  customerPO: z.string().max(50).optional(),
  jobsiteName: z.string().max(200).optional(),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    zip: z.string().min(5),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  salesRepId: z.string().optional(),
  requestedDate: z.string().datetime(),
  appointmentFlag: z.boolean().optional(),
  appointmentWindow: z.string().max(50).optional(),
  codFlag: z.boolean().optional(),
  codAmount: z.number().min(0).optional(),
  specialInstructions: z.string().max(1000).optional(),
  internalNotes: z.string().max(2000).optional(),
  locationId: z.string().min(1),
});

export const updateOrderSchema = createOrderSchema.partial().omit({ locationId: true, customerId: true });

export const addOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(0.01),
  uom: z.string().min(1),
  unitPrice: z.number().min(0),
  length: z.number().min(0).optional(),
  substitutionAllowed: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const transitionOrderSchema = z.object({
  toStatus: z.nativeEnum(OrderStatus),
  reason: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>;
