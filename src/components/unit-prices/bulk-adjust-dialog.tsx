"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp } from "lucide-react";
import { bulkAdjustPrices } from "@/app/(dashboard)/master/unit-prices/actions";
import { toast } from "sonner";

interface Props {
  categories: { id: string; name: string }[];
}

export function BulkAdjustDialog({ categories }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState<string>("");
  const [adjustType, setAdjustType] = useState<"unitPrice" | "costPrice" | "both">("unitPrice");
  const [adjustPercent, setAdjustPercent] = useState<string>("0");

  const handleSubmit = () => {
    const percent = parseFloat(adjustPercent);
    if (isNaN(percent) || percent === 0) {
      toast.error("調整率を入力してください");
      return;
    }

    startTransition(async () => {
      try {
        const result = await bulkAdjustPrices({
          categoryId: categoryId || null,
          adjustType,
          adjustPercent: percent,
        });
        toast.success(`${result.count}件の単価を更新しました`);
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "更新に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium px-3 py-2 transition-colors">
        <TrendingUp className="mr-2 h-4 w-4" />
        一括調整
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>単価一括調整</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>対象</Label>
            <Select value={adjustType} onValueChange={(v) => setAdjustType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unitPrice">見積単価のみ</SelectItem>
                <SelectItem value="costPrice">原価のみ</SelectItem>
                <SelectItem value="both">見積単価と原価</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>調整率（%）</Label>
            <Input
              type="number"
              value={adjustPercent}
              onChange={(e) => setAdjustPercent(e.target.value)}
              placeholder="例: 5 で5%アップ、-3 で3%ダウン"
              min={-50}
              max={100}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              正の値で値上げ、負の値で値下げ（-50%〜100%）
            </p>
          </div>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? "更新中..." : "一括調整を実行"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
