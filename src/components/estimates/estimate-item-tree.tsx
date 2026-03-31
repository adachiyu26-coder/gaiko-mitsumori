"use client";

import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEstimateEditor, generateTempId } from "@/stores/estimate-editor";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const UNITS = ["㎡", "m", "個", "台", "本", "式", "m3", "人工", "セット"];

const LEVEL_LABELS: Record<number, string> = {
  1: "工種",
  2: "大項目",
  3: "中項目",
  4: "明細",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-[#1e3a5f] text-white",
  2: "bg-blue-100 text-blue-900",
  3: "bg-gray-100 text-gray-800",
  4: "",
};

interface Props {
  categories: { id: string; name: string }[];
  showCostPrice: boolean;
}

export function EstimateItemTree({ showCostPrice }: Props) {
  const { items, updateItem, removeItem, addItem } = useEstimateEditor();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsed((s) => ({ ...s, [id]: !s[id] }));
  };

  const getChildItems = (parentId: string | null, level: number) => {
    return items
      .filter(
        (i) =>
          i.parentItemId === parentId && i.level === level
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const addChild = (parentId: string | null, level: number) => {
    const newItem = {
      id: generateTempId(),
      parentItemId: parentId,
      level,
      sortOrder: items.filter((i) => i.parentItemId === parentId).length,
      itemName: "",
      specification: null,
      quantity: null,
      unit: level === 4 ? "式" : null,
      unitPrice: null,
      costPrice: null,
      amount: 0,
      costAmount: 0,
      categoryId: null,
      unitPriceMasterId: null,
      note: null,
      isAlternative: false,
    };
    addItem(newItem);
  };

  const getSubtotal = (parentId: string): number => {
    const children = items.filter((i) => i.parentItemId === parentId);
    return children.reduce((sum, child) => {
      if (child.level === 4 && !child.isAlternative) return sum + child.amount;
      if (child.level < 4) return sum + getSubtotal(child.id);
      return sum;
    }, 0);
  };

  const renderItem = (item: (typeof items)[0]) => {
    const isCollapsed = collapsed[item.id];
    const isHeader = item.level < 4;
    const indent = (item.level - 1) * 24;

    return (
      <div key={item.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded group hover:bg-gray-50 border-b",
            LEVEL_COLORS[item.level]
          )}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {/* Collapse toggle for headers */}
          {isHeader && (
            <button
              onClick={() => toggleCollapse(item.id)}
              className="p-0.5"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Item name */}
          <div className={cn("flex-1", isHeader ? "min-w-[200px]" : "min-w-[150px]")}>
            <Input
              value={item.itemName}
              onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
              placeholder={LEVEL_LABELS[item.level]}
              className={cn(
                "h-8 text-sm",
                isHeader && "font-semibold border-none bg-transparent shadow-none"
              )}
            />
          </div>

          {/* Detail fields only for level 4 */}
          {item.level === 4 && (
            <>
              <Input
                value={item.specification ?? ""}
                onChange={(e) =>
                  updateItem(item.id, { specification: e.target.value || null })
                }
                placeholder="規格"
                className="h-8 text-sm w-28"
              />
              <Input
                type="number"
                value={item.quantity ?? ""}
                onChange={(e) =>
                  updateItem(item.id, {
                    quantity: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="数量"
                className="h-8 text-sm w-20 text-right"
              />
              <Select
                value={item.unit ?? ""}
                onValueChange={(v) => updateItem(item.id, { unit: v ?? null })}
              >
                <SelectTrigger className="h-8 w-16 text-sm">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={item.unitPrice ?? ""}
                onChange={(e) =>
                  updateItem(item.id, {
                    unitPrice: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="単価"
                className="h-8 text-sm w-24 text-right"
              />
              <div className="w-24 text-right text-sm font-mono">
                {formatCurrency(item.amount)}
              </div>
              {showCostPrice && (
                <>
                  <Input
                    type="number"
                    value={item.costPrice ?? ""}
                    onChange={(e) =>
                      updateItem(item.id, {
                        costPrice: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="原価"
                    className="h-8 text-sm w-24 text-right"
                  />
                </>
              )}
            </>
          )}

          {/* Subtotal for headers */}
          {isHeader && (
            <div className="text-sm font-mono mr-2">
              小計 {formatCurrency(getSubtotal(item.id))}
            </div>
          )}

          {/* Add child / delete */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.level < 4 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => addChild(item.id, item.level + 1)}
                title={`${LEVEL_LABELS[item.level + 1]}を追加`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {!isCollapsed &&
          isHeader &&
          getChildItems(item.id, item.level + 1).map(renderItem)}
      </div>
    );
  };

  const rootItems = getChildItems(null, 1);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Column headers */}
      <div className="flex items-center gap-2 py-2 px-2 bg-gray-50 border-b text-xs text-muted-foreground font-medium">
        <div className="flex-1 min-w-[150px] pl-2">品名</div>
        <div className="w-28">規格</div>
        <div className="w-20 text-right">数量</div>
        <div className="w-16">単位</div>
        <div className="w-24 text-right">単価</div>
        <div className="w-24 text-right">金額</div>
        {showCostPrice && <div className="w-24 text-right">原価</div>}
        <div className="w-16" />
      </div>

      {rootItems.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          「工種を追加」ボタンで見積明細を追加してください
        </div>
      ) : (
        rootItems.map(renderItem)
      )}
    </div>
  );
}
