"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateCompanySettings } from "./actions";

interface Props {
  company: {
    id: string;
    name: string;
    nameKana: string | null;
    abbreviation: string | null;
    postalCode: string | null;
    address: string | null;
    phone: string | null;
    fax: string | null;
    email: string | null;
    website: string | null;
    registrationNumber: string | null;
    defaultTaxRate: number;
    defaultExpenseRate: number;
    estimateValidityDays: number;
  };
  isOwner: boolean;
}

export function CompanySettingsForm({ company, isOwner }: Props) {
  const [isPending, startTransition] = useTransition();
  const form = useForm({ defaultValues: company });

  const onSubmit = (data: typeof company) => {
    startTransition(async () => {
      try {
        await updateCompanySettings(data);
        toast.success("設定を保存しました");
      } catch {
        toast.error("保存に失敗しました");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>会社情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>会社名</Label>
              <Input {...form.register("name")} disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label>略称（見積番号用）</Label>
              <Input {...form.register("abbreviation")} disabled={!isOwner} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>郵便番号</Label>
              <Input {...form.register("postalCode")} disabled={!isOwner} />
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
              <Input {...form.register("email")} disabled={!isOwner} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>適格請求書発行事業者番号</Label>
            <Input
              {...form.register("registrationNumber")}
              placeholder="T1234567890123"
              disabled={!isOwner}
            />
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
                {...form.register("defaultTaxRate", { valueAsNumber: true })}
                disabled={!isOwner}
              />
            </div>
            <div className="space-y-2">
              <Label>諸経費率（%）</Label>
              <Input
                type="number"
                {...form.register("defaultExpenseRate", { valueAsNumber: true })}
                disabled={!isOwner}
              />
            </div>
            <div className="space-y-2">
              <Label>見積有効期限（日）</Label>
              <Input
                type="number"
                {...form.register("estimateValidityDays", {
                  valueAsNumber: true,
                })}
                disabled={!isOwner}
              />
            </div>
          </div>
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
