"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUnitPrice, importUnitPricesFromCsv } from "@/app/(dashboard)/master/unit-prices/actions";
import { toast } from "sonner";

interface Props {
  canEdit: boolean;
  categories: { id: string; name: string }[];
}

export function UnitPriceToolbar({ canEdit, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    itemName: "",
    specification: "",
    unit: "式",
    unitPrice: "",
    costPrice: "",
    manufacturer: "",
    modelNumber: "",
    categoryId: "",
  });

  const handleCreate = () => {
    startTransition(async () => {
      try {
        await createUnitPrice({
          itemName: form.itemName,
          specification: form.specification || null,
          unit: form.unit,
          unitPrice: parseInt(form.unitPrice) || 0,
          costPrice: form.costPrice ? parseInt(form.costPrice) : null,
          manufacturer: form.manufacturer || null,
          modelNumber: form.modelNumber || null,
          categoryId: form.categoryId || null,
          isActive: true,
          note: null,
        });
        toast.success("単価を登録しました");
        setOpen(false);
        setForm({
          itemName: "",
          specification: "",
          unit: "式",
          unitPrice: "",
          costPrice: "",
          manufacturer: "",
          modelNumber: "",
          categoryId: "",
        });
      } catch {
        toast.error("登録に失敗しました");
      }
    });
  };

  const handleCsvImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      startTransition(async () => {
        try {
          const result = await importUnitPricesFromCsv(text);
          toast.success(`${result.count}件の単価をインポートしました`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "インポートに失敗しました"
          );
        }
      });
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleCsvExport = () => {
    window.location.href = "/api/master/unit-prices/export";
  };

  if (!canEdit) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-sm font-medium px-4 py-2 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          新規登録
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>単価マスタ登録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>品名 *</Label>
                <Input
                  value={form.itemName}
                  onChange={(e) =>
                    setForm({ ...form, itemName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>規格</Label>
                <Input
                  value={form.specification}
                  onChange={(e) =>
                    setForm({ ...form, specification: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-2">
                <Label>単位 *</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm({ ...form, unit: v ?? "式" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["㎡", "m", "個", "台", "本", "式", "m3", "人工", "セット"].map(
                      (u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>見積単価 *</Label>
                <Input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>原価</Label>
                <Input
                  type="number"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>メーカー</Label>
                <Input
                  value={form.manufacturer}
                  onChange={(e) =>
                    setForm({ ...form, manufacturer: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>型番</Label>
                <Input
                  value={form.modelNumber}
                  onChange={(e) =>
                    setForm({ ...form, modelNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={isPending || !form.itemName || !form.unitPrice}
              className="w-full bg-[#1e3a5f] hover:bg-[#162d4a]"
            >
              {isPending ? "登録中..." : "登録"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={handleCsvImport} disabled={isPending}>
        <Upload className="mr-2 h-4 w-4" />
        CSVインポート
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button variant="outline" onClick={handleCsvExport}>
        <Download className="mr-2 h-4 w-4" />
        CSVエクスポート
      </Button>
    </div>
  );
}
