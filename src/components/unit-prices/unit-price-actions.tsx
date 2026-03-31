"use client";

import { useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteUnitPrice } from "@/app/(dashboard)/master/unit-prices/actions";
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

export function UnitPriceActions({ item }: Props) {
  const [isPending, startTransition] = useTransition();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger >
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
