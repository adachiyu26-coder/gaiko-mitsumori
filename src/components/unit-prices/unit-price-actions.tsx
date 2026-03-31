"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  deleteUnitPrice,
  updateUnitPrice,
  toggleUnitPriceActive,
} from "@/app/(dashboard)/master/unit-prices/actions";
import { toast } from "sonner";

interface Props {
  item: {
    id: string;
    itemName: string;
    specification: string | null;
    unit: string;
    unitPrice: number;
    costPrice: number | null;
    manufacturer: string | null;
    modelNumber: string | null;
    categoryId: string | null;
    isActive: boolean;
    note: string | null;
  };
  categories: { id: string; name: string }[];
}

export function UnitPriceActions({ item, categories }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    itemName: item.itemName,
    specification: item.specification ?? "",
    unit: item.unit,
    unitPrice: String(item.unitPrice),
    costPrice: item.costPrice != null ? String(item.costPrice) : "",
    manufacturer: item.manufacturer ?? "",
    modelNumber: item.modelNumber ?? "",
    categoryId: item.categoryId ?? "",
  });

  const handleDelete = () => {
    if (!confirm(`「${item.itemName}」を削除しますか？`)) return;
    startTransition(async () => {
      try {
        await deleteUnitPrice(item.id);
        toast.success("削除しました");
      } catch {
        toast.error("削除に失敗しました");
      }
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        await toggleUnitPriceActive(item.id, !item.isActive);
        toast.success(item.isActive ? "無効にしました" : "有効にしました");
      } catch {
        toast.error("更新に失敗しました");
      }
    });
  };

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        await updateUnitPrice(item.id, {
          itemName: form.itemName,
          specification: form.specification || null,
          unit: form.unit,
          unitPrice: parseInt(form.unitPrice) || 0,
          costPrice: form.costPrice ? parseInt(form.costPrice) : null,
          manufacturer: form.manufacturer || null,
          modelNumber: form.modelNumber || null,
          categoryId: form.categoryId || null,
          isActive: item.isActive,
          note: item.note,
        });
        toast.success("更新しました");
        setEditOpen(false);
      } catch {
        toast.error("更新に失敗しました");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent transition-colors disabled:opacity-50"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {item.isActive ? (
              <>
                <ToggleLeft className="mr-2 h-4 w-4" />
                無効にする
              </>
            ) : (
              <>
                <ToggleRight className="mr-2 h-4 w-4" />
                有効にする
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>単価マスタ編集</DialogTitle>
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
                  <SelectItem value="">未分類</SelectItem>
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
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>規格</Label>
                <Input
                  value={form.specification}
                  onChange={(e) => setForm({ ...form, specification: e.target.value })}
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
                    {["㎡", "m", "個", "台", "本", "式", "m3", "人工", "セット"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>見積単価 *</Label>
                <Input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>原価</Label>
                <Input
                  type="number"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>メーカー</Label>
                <Input
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>型番</Label>
                <Input
                  value={form.modelNumber}
                  onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isPending || !form.itemName || !form.unitPrice}
              className="w-full bg-[#1e3a5f] hover:bg-[#162d4a]"
            >
              {isPending ? "更新中..." : "更新"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
