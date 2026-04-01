import { z } from "zod";

export const unitPriceSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  itemName: z.string().min(1, "品名は必須です").max(200),
  specification: z.string().max(500).optional().nullable(),
  unit: z.string().min(1, "単位は必須です").max(10),
  unitPrice: z.number().min(0, "見積単価は0以上で入力してください"),
  costPrice: z.number().min(0).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
  modelNumber: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  note: z.string().optional().nullable(),
}).refine(
  (data) => data.costPrice == null || data.costPrice <= data.unitPrice,
  { message: "原価は見積単価以下で入力してください", path: ["costPrice"] }
);

export type UnitPriceFormData = z.infer<typeof unitPriceSchema>;
