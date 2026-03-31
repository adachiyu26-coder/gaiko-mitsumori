"use client";

import { useTransition, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, ImageIcon } from "lucide-react";
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
  logoUrl?: string | null;
}

export function CompanySettingsForm({ company, isOwner, logoUrl: initialLogoUrl }: Props) {
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/company/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogoUrl(data.logoUrl);
      toast.success("ロゴをアップロードしました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoDelete = async () => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/company/logo", { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      setLogoUrl(null);
      toast.success("ロゴを削除しました");
    } catch {
      toast.error("削除に失敗しました");
    } finally {
      setIsUploading(false);
    }
  };
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
          <CardTitle>会社ロゴ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            見積書PDFのヘッダーに表示されるロゴ画像（PNG・JPEG・WebP・SVG、2MB以下）
          </p>
          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="w-40 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="会社ロゴ"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6 mb-1" />
                  <span className="text-[10px]">未設定</span>
                </div>
              )}
            </div>
            {/* Actions */}
            {isOwner && (
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "アップロード中..." : logoUrl ? "変更" : "アップロード"}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLogoDelete}
                    disabled={isUploading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                )}
              </div>
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
            className="bg-brand hover:bg-brand-hover"
            disabled={isPending}
          >
            {isPending ? "保存中..." : "設定を保存"}
          </Button>
        </div>
      )}
    </form>
  );
}
