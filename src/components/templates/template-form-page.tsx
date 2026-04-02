"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { createTemplate } from "@/app/(dashboard)/master/templates/actions";
import { toast } from "sonner";
import Link from "next/link";

interface TemplateItem {
  id: string;
  level: number;
  itemName: string;
  specification: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  costPrice: string;
}

let counter = 0;
function tempId() {
  return `temp-${++counter}`;
}

export function TemplateFormPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [items, setItems] = useState<TemplateItem[]>([
    { id: tempId(), level: 1, itemName: "新規工種", specification: "", quantity: "", unit: "", unitPrice: "", costPrice: "" },
  ]);

  const addItem = (level: number) => {
    const levelNames: Record<number, string> = { 1: "新規工種", 2: "新規大項目", 3: "新規中項目", 4: "新規品名" };
    setItems([...items, {
      id: tempId(),
      level,
      itemName: levelNames[level] ?? "新規項目",
      specification: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      costPrice: "",
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof TemplateItem, value: string) => {
    setItems(items.map((i) => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("テンプレート名を入力してください");
      return;
    }
    if (items.length === 0) {
      toast.error("明細を1つ以上追加してください");
      return;
    }

    startTransition(async () => {
      try {
        await createTemplate({
          name: name.trim(),
          description: description.trim() || null,
          isShared,
          items: items.map((item, idx) => ({
            level: item.level,
            sortOrder: idx,
            itemName: item.itemName,
            specification: item.specification || null,
            quantity: item.quantity ? Number(item.quantity) : null,
            unit: item.unit || null,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            costPrice: item.costPrice ? Number(item.costPrice) : null,
          })),
        });
        toast.success("テンプレートを作成しました");
        router.push("/master/templates");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "作成に失敗しました");
      }
    });
  };

  const LEVEL_BG: Record<number, string> = {
    1: "bg-brand/[0.07]",
    2: "bg-blue-50/60",
    3: "bg-gray-50",
    4: "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/master/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">新規テンプレート作成</h1>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="bg-brand hover:bg-brand-hover">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "保存中..." : "保存"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>テンプレート名 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: カーポート2台用標準" />
            </div>
            <div className="space-y-2">
              <Label>説明</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="テンプレートの用途や特徴" rows={2} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={isShared} onCheckedChange={setIsShared} />
              <Label>チーム全体で共有する</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>明細項目</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addItem(1)}>+ 工種</Button>
            <Button variant="outline" size="sm" onClick={() => addItem(2)}>+ 大項目</Button>
            <Button variant="outline" size="sm" onClick={() => addItem(3)}>+ 中項目</Button>
            <Button variant="outline" size="sm" onClick={() => addItem(4)}>+ 品名</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {items.map((item) => {
              const indent = (item.level - 1) * 20;
              const isDetail = item.level === 4;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 py-1.5 px-2 border-b text-sm ${LEVEL_BG[item.level] ?? ""}`}
                  style={{ paddingLeft: `${indent + 8}px` }}
                >
                  <span className="text-[10px] text-muted-foreground w-6 shrink-0">L{item.level}</span>
                  <Input
                    value={item.itemName}
                    onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                    className="h-7 text-sm flex-1"
                  />
                  {isDetail && (
                    <>
                      <Input
                        value={item.specification}
                        onChange={(e) => updateItem(item.id, "specification", e.target.value)}
                        className="h-7 text-xs w-24"
                        placeholder="規格"
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                        className="h-7 text-xs w-16"
                        placeholder="数量"
                      />
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                        className="h-7 text-xs w-12"
                        placeholder="単位"
                      />
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                        className="h-7 text-xs w-20"
                        placeholder="単価"
                      />
                      <Input
                        type="number"
                        value={item.costPrice}
                        onChange={(e) => updateItem(item.id, "costPrice", e.target.value)}
                        className="h-7 text-xs w-20"
                        placeholder="原価"
                      />
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="shrink-0 text-destructive h-7 w-7 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
