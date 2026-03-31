import { z } from "zod";

export const customerSchema = z.object({
  customerType: z.enum(["individual", "corporate", "subcontract"]),
  name: z.string().min(1, "顧客名は必須です").max(100),
  nameKana: z.string().max(100).optional().nullable(),
  honorific: z.string().max(10),
  postalCode: z
    .string()
    .max(8)
    .regex(/^(\d{3}-?\d{4})?$/, "郵便番号の形式が正しくありません")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z
    .string()
    .email("メールアドレスの形式が正しくありません")
    .optional()
    .nullable()
    .or(z.literal("")),
  referralSource: z.string().max(100).optional().nullable(),
  note: z.string().optional().nullable(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
