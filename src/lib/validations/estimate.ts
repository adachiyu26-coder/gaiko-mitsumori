import { z } from "zod";

export const estimateSchema = z.object({
  title: z.string().min(1, "件名は必須です").max(200),
  customerId: z.string().uuid().optional().nullable(),
  siteAddress: z.string().optional().nullable(),
  estimateDate: z.string().min(1, "見積日は必須です"),
  expiryDate: z.string().optional().nullable(),
  status: z.enum(["draft", "submitted", "accepted", "rejected", "expired"]).default("draft"),
  expenseRate: z.number().min(0).max(100).default(10),
  discountType: z.enum(["amount", "rate"]).default("amount"),
  discountValue: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(10),
  note: z.string().optional().nullable(),
  internalMemo: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
});

export const estimateItemSchema = z.object({
  id: z.string().uuid().optional(),
  parentItemId: z.string().uuid().optional().nullable(),
  level: z.number().int().min(1).max(4),
  sortOrder: z.number().int().default(0),
  itemName: z.string().min(1, "品名は必須です").max(200),
  specification: z.string().max(500).optional().nullable(),
  quantity: z.number().optional().nullable(),
  unit: z.string().max(10).optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  unitPriceMasterId: z.string().uuid().optional().nullable(),
  note: z.string().optional().nullable(),
  isAlternative: z.boolean().default(false),
});

export type EstimateFormData = z.infer<typeof estimateSchema>;
export type EstimateItemFormData = z.infer<typeof estimateItemSchema>;
