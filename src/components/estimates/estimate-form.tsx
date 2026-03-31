"use client";

import { useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Save, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useEstimateEditor, generateTempId, type EditorItem } from "@/stores/estimate-editor";
import { EstimateItemTree } from "./estimate-item-tree";
import { EstimateSummary } from "./estimate-summary";
import { ProfitMeter } from "./profit-meter";
import { createEstimate, updateEstimate } from "@/app/(dashboard)/estimates/actions";

interface Props {
  isEdit?: boolean;
  estimateId?: string;
  defaultValues?: {
    title: string;
    customerId: string | null;
    siteAddress: string | null;
    estimateDate: string;
    expiryDate: string | null;
    expenseRate: number;
    discountType: "amount" | "rate";
    discountValue: number;
    taxRate: number;
    note: string | null;
    internalMemo: string | null;
    paymentTerms: string | null;
    items: EditorItem[];
  };
  customers: { id: string; name: string; honorific: string }[];
  categories: { id: string; name: string }[];
  showCostPrice: boolean;
}

export function EstimateForm({
  isEdit,
  estimateId,
  defaultValues,
  customers,
  categories,
  showCostPrice,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const store = useEstimateEditor();

  const [header, setHeader] = useState({
    title: defaultValues?.title ?? "",
    customerId: defaultValues?.customerId ?? "",
    siteAddress: defaultValues?.siteAddress ?? "",
    estimateDate:
      defaultValues?.estimateDate ??
      new Date().toISOString().slice(0, 10),
    expiryDate: defaultValues?.expiryDate ?? "",
    note: defaultValues?.note ?? "",
    internalMemo: defaultValues?.internalMemo ?? "",
    paymentTerms: defaultValues?.paymentTerms ?? "",
  });

  useEffect(() => {
    if (defaultValues) {
      store.setItems(defaultValues.items);
      store.setOptions({
        expenseRate: defaultValues.expenseRate,
        discountType: defaultValues.discountType,
        discountValue: defaultValues.discountValue,
        taxRate: defaultValues.taxRate,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    if (!header.title) {
      toast.error("件名を入力してください");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          title: header.title,
          customerId: header.customerId || null,
          siteAddress: header.siteAddress || null,
          estimateDate: header.estimateDate,
          expiryDate: header.expiryDate || null,
          expenseRate: store.expenseRate,
          discountType: store.discountType,
          discountValue: store.discountValue,
          taxRate: store.taxRate,
          note: header.note || null,
          internalMemo: header.internalMemo || null,
          paymentTerms: header.paymentTerms || null,
          items: store.items.map((item, idx) => ({
            level: item.level,
            sortOrder: idx,
            itemName: item.itemName,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            categoryId: item.categoryId,
            unitPriceMasterId: item.unitPriceMasterId,
            note: item.note,
            isAlternative: item.isAlternative,
          })),
        };

        if (isEdit && estimateId) {
          await updateEstimate(estimateId, payload);
          toast.success("見積を保存しました");
          store.setDirty(false);
        } else {
          await createEstimate(payload);
          toast.success("見積を作成しました");
        }
      } catch {
        toast.error("保存に失敗しました");
      }
    });
  };

  const handleAddCategory = () => {
    store.addItem({
      id: generateTempId(),
      parentItemId: null,
      level: 1,
      sortOrder: store.items.length,
      itemName: "新規工種",
      specification: null,
      quantity: null,
      unit: null,
      unitPrice: null,
      costPrice: null,
      amount: 0,
      costAmount: 0,
      categoryId: null,
      unitPriceMasterId: null,
      note: null,
      isAlternative: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "見積編集" : "新規見積作成"}
        </h1>
        <div className="flex gap-2">
          {isEdit && (
            <Button
              variant="outline"
              onClick={() =>
                window.open(`/api/estimates/${estimateId}/pdf`, "_blank")
              }
            >
              <FileDown className="mr-2 h-4 w-4" />
              PDF
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#1e3a5f] hover:bg-[#162d4a]"
          >
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>件名 *</Label>
              <Input
                value={header.title}
                onChange={(e) =>
                  setHeader({ ...header, title: e.target.value })
                }
                placeholder="〇〇様邸 外構工事"
              />
            </div>
            <div className="space-y-2">
              <Label>顧客</Label>
              <Select
                value={header.customerId}
                onValueChange={(v) =>
                  setHeader({ ...header, customerId: v ?? "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.honorific}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>現場住所</Label>
              <Input
                value={header.siteAddress}
                onChange={(e) =>
                  setHeader({ ...header, siteAddress: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>見積日</Label>
              <Input
                type="date"
                value={header.estimateDate}
                onChange={(e) =>
                  setHeader({ ...header, estimateDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>有効期限</Label>
              <Input
                type="date"
                value={header.expiryDate}
                onChange={(e) =>
                  setHeader({ ...header, expiryDate: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items tree */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>見積明細</CardTitle>
          <Button onClick={handleAddCategory} variant="outline" size="sm">
            + 工種を追加
          </Button>
        </CardHeader>
        <CardContent>
          <EstimateItemTree
            categories={categories}
            showCostPrice={showCostPrice}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EstimateSummary />
        {showCostPrice && <ProfitMeter />}
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>備考・メモ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>備考（見積書に記載）</Label>
              <Textarea
                value={header.note}
                onChange={(e) =>
                  setHeader({ ...header, note: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>社内メモ（PDF非出力）</Label>
              <Textarea
                value={header.internalMemo}
                onChange={(e) =>
                  setHeader({ ...header, internalMemo: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>支払条件</Label>
              <Input
                value={header.paymentTerms}
                onChange={(e) =>
                  setHeader({ ...header, paymentTerms: e.target.value })
                }
                placeholder="契約時50%、完了時50%"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
