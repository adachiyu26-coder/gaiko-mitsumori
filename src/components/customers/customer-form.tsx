"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerSchema, type CustomerFormData } from "@/lib/validations/customer";
import { createCustomer, updateCustomer } from "@/app/(dashboard)/customers/actions";
import { toast } from "sonner";

interface CustomerFormProps {
  defaultValues?: CustomerFormData & { id?: string };
  isEdit?: boolean;
}

export function CustomerForm({ defaultValues, isEdit }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultValues ?? {
      customerType: "individual",
      name: "",
      honorific: "様",
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    startTransition(async () => {
      try {
        if (isEdit && defaultValues?.id) {
          await updateCustomer(defaultValues.id, data);
        } else {
          await createCustomer(data);
        }
        toast.success(isEdit ? "顧客情報を更新しました" : "顧客を登録しました");
      } catch {
        toast.error("保存に失敗しました");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "顧客情報の編集" : "新規顧客登録"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerType">顧客区分</Label>
              <Select
                value={form.watch("customerType")}
                onValueChange={(v) =>
                  form.setValue("customerType", (v ?? "individual") as CustomerFormData["customerType"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">個人</SelectItem>
                  <SelectItem value="corporate">法人</SelectItem>
                  <SelectItem value="subcontract">下請</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="honorific">敬称</Label>
              <Select
                value={form.watch("honorific") ?? "様"}
                onValueChange={(v) => form.setValue("honorific", v ?? "様")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="様">様</SelectItem>
                  <SelectItem value="御中">御中</SelectItem>
                  <SelectItem value="殿">殿</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">顧客名 *</Label>
              <Input {...form.register("name")} placeholder="山田 太郎" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameKana">フリガナ</Label>
              <Input {...form.register("nameKana")} placeholder="ヤマダ タロウ" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">郵便番号</Label>
              <Input {...form.register("postalCode")} placeholder="123-4567" />
              {form.formState.errors.postalCode && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.postalCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input {...form.register("phone")} placeholder="090-1234-5678" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input {...form.register("address")} placeholder="東京都渋谷区..." />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="mail@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralSource">紹介元</Label>
              <Input {...form.register("referralSource")} placeholder="紹介元名" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">備考</Label>
            <Textarea {...form.register("note")} rows={3} />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#162d4a]" disabled={isPending}>
              {isPending ? "保存中..." : isEdit ? "更新" : "登録"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
