"use client";

import { useEffect, useTransition, useState, useCallback } from "react";
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
import { Save, FileDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useEstimateEditor, generateTempId, type EditorItem } from "@/stores/estimate-editor";
import { EstimateItemTree } from "./estimate-item-tree";
import { EstimateItemTreeMobile } from "./estimate-item-tree-mobile";
import { EstimateSummary } from "./estimate-summary";
import { ProfitMeter } from "./profit-meter";
import { createEstimate, updateEstimate } from "@/app/(dashboard)/estimates/actions";
import { TemplatePicker } from "./template-picker";
import { AiGenerateDialog } from "./ai-generate-dialog";

interface Props {
  isEdit?: boolean;
  estimateId?: string;
  estimateVersion?: number;
  estimateStatus?: string;
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
  companyDefaults?: {
    taxRate: number;
    expenseRate: number;
    estimateValidityDays: number;
  };
  templates?: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    isShared: boolean;
    _count: { items: number };
  }[];
}

export function EstimateForm({
  isEdit,
  estimateId,
  estimateVersion,
  estimateStatus,
  defaultValues,
  customers,
  categories,
  showCostPrice,
  companyDefaults,
  templates,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const store = useEstimateEditor();
  const [isDirty, setIsDirty] = useState(false);

  const updateHeader = (updates: Partial<typeof header>) => {
    setHeader((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  // Compute default expiry date from company settings
  const defaultExpiry = (() => {
    if (defaultValues?.expiryDate) return defaultValues.expiryDate;
    if (!isEdit && companyDefaults?.estimateValidityDays) {
      const d = new Date();
      d.setDate(d.getDate() + companyDefaults.estimateValidityDays);
      return d.toISOString().slice(0, 10);
    }
    return "";
  })();

  const [header, setHeader] = useState({
    title: defaultValues?.title ?? "",
    customerId: defaultValues?.customerId ?? "",
    siteAddress: defaultValues?.siteAddress ?? "",
    estimateDate:
      defaultValues?.estimateDate ??
      new Date().toISOString().slice(0, 10),
    expiryDate: defaultExpiry,
    note: defaultValues?.note ?? "",
    internalMemo: defaultValues?.internalMemo ?? "",
    paymentTerms: defaultValues?.paymentTerms ?? "",
  });

  useEffect(() => {
    store.initEditor(defaultValues?.items ?? [], {
      expenseRate: defaultValues?.expenseRate ?? companyDefaults?.expenseRate ?? 10,
      discountType: defaultValues?.discountType ?? "amount",
      discountValue: defaultValues?.discountValue ?? 0,
      taxRate: defaultValues?.taxRate ?? companyDefaults?.taxRate ?? 10,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 未保存変更の警告（ヘッダーまたは明細のどちらかが変更されていれば警告）
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty || store.isDirty) {
        e.preventDefault();
      }
    },
    [isDirty, store.isDirty]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleBeforeUnload]);

  const handleSave = () => {
    if (!header.title) {
      toast.error("件名を入力してください");
      return;
    }
    if (store.items.length === 0) {
      toast.error("見積明細を1つ以上追加してください");
      return;
    }

    startTransition(async () => {
      try {
        // temp-xxx 形式のIDをUUIDへリマップして親子関係を正しく保存する
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const idMap = new Map<string, string>();
        for (const item of store.items) {
          idMap.set(item.id, UUID_RE.test(item.id) ? item.id : crypto.randomUUID());
        }

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
            id: idMap.get(item.id),
            level: item.level,
            parentItemId: item.parentItemId
              ? (idMap.get(item.parentItemId) ?? null)
              : null,
            sortOrder: item.sortOrder ?? idx,
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
          await updateEstimate(estimateId, { ...payload, version: estimateVersion });
          toast.success("見積を保存しました");
          store.setDirty(false);
          setIsDirty(false);
        } else {
          await createEstimate(payload);
          toast.success("見積を作成しました");
          setIsDirty(false);
        }
      } catch {
        toast.error("保存に失敗しました");
      }
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: EditorItem[] = data.items.map((item: Record<string, unknown>, idx: number) => ({
        id: generateTempId(),
        parentItemId: null,
        level: item.level as number,
        sortOrder: idx,
        itemName: item.itemName as string,
        specification: (item.specification as string) || null,
        quantity: item.quantity != null ? Number(item.quantity) : null,
        unit: (item.unit as string) || null,
        unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
        costPrice: item.costPrice != null ? Number(item.costPrice) : null,
        amount: 0,
        costAmount: 0,
        categoryId: (item.categoryId as string) || null,
        unitPriceMasterId: null,
        note: (item.note as string) || null,
        isAlternative: false,
      }));
      // Rebuild parent-child references based on level hierarchy
      const stack: string[] = [];
      for (const item of items) {
        while (stack.length >= item.level) stack.pop();
        item.parentItemId = stack.length > 0 ? stack[stack.length - 1] : null;
        stack.push(item.id);
      }
      store.initEditor(items, {
        expenseRate: store.expenseRate,
        discountType: store.discountType,
        discountValue: store.discountValue,
        taxRate: store.taxRate,
      });
      store.setDirty(true);
      setIsDirty(true);
      toast.success("テンプレートを適用しました");
    } catch {
      toast.error("テンプレートの読み込みに失敗しました");
    }
  };

  const handleAiGenerate = (title: string, items: { level: number; itemName: string; specification?: string | null; quantity?: number | null; unit?: string | null; unitPrice?: number | null; costPrice?: number | null }[]) => {
    // Update header title
    if (title) updateHeader({ title });

    // Convert AI items to EditorItems
    const editorItems: EditorItem[] = items.map((item, idx) => ({
      id: generateTempId(),
      parentItemId: null,
      level: item.level,
      sortOrder: idx,
      itemName: item.itemName,
      specification: item.specification || null,
      quantity: item.quantity ?? null,
      unit: item.unit || null,
      unitPrice: item.unitPrice ?? null,
      costPrice: item.costPrice ?? null,
      amount: 0,
      costAmount: 0,
      categoryId: null,
      unitPriceMasterId: null,
      note: null,
      isAlternative: false,
    }));

    // Rebuild parent-child based on level
    const stack: string[] = [];
    for (const item of editorItems) {
      while (stack.length >= item.level) stack.pop();
      item.parentItemId = stack.length > 0 ? stack[stack.length - 1] : null;
      stack.push(item.id);
    }

    store.initEditor(editorItems, {
      expenseRate: store.expenseRate,
      discountType: store.discountType,
      discountValue: store.discountValue,
      taxRate: store.taxRate,
    });
    store.setDirty(true);
    setIsDirty(true);
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
      {/* Status warning for accepted/rejected estimates */}
      {isEdit && (estimateStatus === "accepted" || estimateStatus === "rejected") && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          この見積は「{estimateStatus === "accepted" ? "受注" : "失注"}」ステータスです。編集すると内容が上書きされます。
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEdit ? "見積編集" : "新規見積作成"}
        </h1>
        <div className="flex gap-2">
          {!isEdit && templates && templates.length > 0 && (
            <TemplatePicker templates={templates} onApply={handleApplyTemplate} />
          )}
          {!isEdit && <AiGenerateDialog onGenerate={handleAiGenerate} />}
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
            className="bg-brand hover:bg-brand-hover"
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
                  updateHeader({ title: e.target.value })
                }
                placeholder="〇〇様邸 外構工事"
              />
            </div>
            <div className="space-y-2">
              <Label>顧客</Label>
              <Select
                value={header.customerId}
                items={Object.fromEntries(
                  customers.map((c) => [c.id, `${c.name}${c.honorific}`])
                )}
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
                  updateHeader({ siteAddress: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>見積日</Label>
              <Input
                type="date"
                value={header.estimateDate}
                onChange={(e) =>
                  updateHeader({ estimateDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>有効期限</Label>
              <Input
                type="date"
                value={header.expiryDate}
                onChange={(e) =>
                  updateHeader({ expiryDate: e.target.value })
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
          {/* Desktop */}
          <div className="hidden md:block">
            <EstimateItemTree
              categories={categories}
              showCostPrice={showCostPrice}
            />
          </div>
          {/* Mobile */}
          <div className="md:hidden">
            <EstimateItemTreeMobile
              categories={categories}
              showCostPrice={showCostPrice}
            />
          </div>
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
                  updateHeader({ note: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>社内メモ（PDF非出力）</Label>
              <Textarea
                value={header.internalMemo}
                onChange={(e) =>
                  updateHeader({ internalMemo: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>支払条件</Label>
              <Input
                value={header.paymentTerms}
                onChange={(e) =>
                  updateHeader({ paymentTerms: e.target.value })
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
