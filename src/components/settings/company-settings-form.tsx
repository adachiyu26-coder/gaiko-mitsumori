"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateCompanySettings } from "./actions";

const companySettingsSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "会社名は必須です"),
  nameKana: z.string().nullable().optional(),
  abbreviation: z.string().max(10, "略称は10文字以内で入力してください").nullable().optional(),
  postalCode: z
    .string()
    .regex(/^(\d{3}-?\d{4})?$/, "郵便番号の形式が正しくありません（例: 123-4567）")
    .nullable()
    .optional()
    .or(z.literal("")),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.string().email("メールアドレスの形式が正しくありません").nullable().optional().or(z.literal("")),
  website: z.string().nullable().optional(),
  registrationNumber: z
    .string()
    .regex(/^(T\d{13})?$/, "登録番号の形式が正しくありません（例: T1234567890123）")
    .nullable()
    .optional()
    .or(z.literal("")),
  defaultTaxRate: z
    .number()
    .min(0, "0以上で入力してください")
    .max(100, "100以下で入力してください"),
  defaultExpenseRate: z
    .number()
    .min(0, "0以上で入力してください")
    .max(100, "100以下で入力してください"),
  estimateValidityDays: z
    .number()
    .int("整数で入力してください")
    .min(1, "1以上で入力してください")
    .max(365, "365以下で入力してください"),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

interface Props {
  company: CompanySettingsFormData;
  isOwner: boolean;
}

export function CompanySettingsForm({ company, isOwner }: Props) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: company,
  });

  const onSubmit = (data: CompanySettingsFormData) => {
    startTransition(async () => {
      try {
        await updateCompanySettings(data);
        toast.success("設定を保存しました");
      } catch {
        toast.error("保存に失敗しました");
      }
    });
  };

  const err = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>会社情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>会社名 *</Label>
              <Input {...form.register("name")} disabled={!isOwner} />
              {err.name && <p className="text-sm text-destructive">{err.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>略称（見積番号用）</Label>
              <Input {...form.register("abbreviation")} disabled={!isOwner} />
              {err.abbreviation && <p className="text-sm text-destructive">{err.abbreviation.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>郵便番号</Label>
              <Input {...form.register("postalCode")} placeholder="123-4567" disabled={!isOwner} />
              {err.postalCode && <p className="text-sm text-destructive">{err.postalCode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>電話番号</Label>
              <Input {...form.register("phone")} disabled={!isOwner} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>住所</Label>
            <Input {...form.register("address")} disabled={!isOwner} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>FAX</Label>
              <Input {...form.register("fax")} disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>メール</Label>
              <Input {...form.register("email")} type="email" disabled={!isOwner} />
              {err.email && <p className="text-sm text-destructive">{err.email.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>適格請求書発行事業者番号</Label>
            <Input
              {...form.register("registrationNumber")}
              placeholder="T1234567890123"
              disabled={!isOwner}
            />
            {err.registrationNumber && (
              <p className="text-sm text-destructive">{err.registrationNumber.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>デフォルト設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>消費税率（%）</Label>
              <Input
                type="number"
                min={0}
                max={100}
                {...form.register("defaultTaxRate", { valueAsNumber: true })}
                disabled={!isOwner}
              />
              {err.defaultTaxRate && (
                <p className="text-sm text-destructive">{err.defaultTaxRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>諸経費率（%）</Label>
              <Input
                type="number"
                min={0}
                max={100}
                {...form.register("defaultExpenseRate", { valueAsNumber: true })}
                disabled={!isOwner}
              />
              {err.defaultExpenseRate && (
                <p className="text-sm text-destructive">{err.defaultExpenseRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>見積有効期限（日）</Label>
              <Input
                type="number"
                min={1}
                max={365}
                {...form.register("estimateValidityDays", { valueAsNumber: true })}
                disabled={!isOwner}
              />
              {err.estimateValidityDays && (
                <p className="text-sm text-destructive">{err.estimateValidityDays.message}</p>
              )}
            </div>
          </div>
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              ※ 設定の変更はオーナーのみ可能です
            </p>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-[#1e3a5f] hover:bg-[#162d4a]"
            disabled={isPending}
          >
            {isPending ? "保存中..." : "設定を保存"}
          </Button>
        </div>
      )}
    </form>
  );
}
