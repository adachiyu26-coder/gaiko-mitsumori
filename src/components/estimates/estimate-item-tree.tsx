"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, GitBranch } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEstimateEditor, generateTempId, type EditorItem } from "@/stores/estimate-editor";
import { formatCurrency } from "@/lib/utils/format";
import { ESTIMATE_UNITS } from "@/lib/constants/status";
import { cn } from "@/lib/utils";
import { PriceIndicator } from "./price-indicator";

const UNITS = ESTIMATE_UNITS;

const LEVEL_LABELS: Record<number, string> = {
  1: "工種",
  2: "大項目",
  3: "中項目",
  4: "品名",
};

// 階層ごとの行スタイル
const LEVEL_ROW: Record<number, string> = {
  1: "bg-brand/[0.07] border-l-[3px] border-l-brand",
  2: "bg-blue-50/60 border-l-[3px] border-l-blue-400",
  3: "bg-gray-50 border-l-2 border-l-gray-300",
  4: "bg-white hover:bg-slate-50/80",
};

// 階層バッジスタイル
const LEVEL_BADGE: Record<number, string> = {
  1: "bg-brand text-white",
  2: "bg-blue-500 text-white",
  3: "bg-gray-400 text-white",
  4: "bg-gray-100 border text-gray-500",
};

interface Props {
  categories: { id: string; name: string }[];
  showCostPrice: boolean;
}

/** parentId 直下の全子孫アイテムの金額合計（代替案除く） */
function calcSectionTotal(allItems: EditorItem[], parentId: string): number {
  return allItems
    .filter((i) => i.parentItemId === parentId && !i.isAlternative)
    .reduce((sum, child) => sum + child.amount + calcSectionTotal(allItems, child.id), 0);
}

function childrenOf(
  allItems: EditorItem[],
  parentId: string | null,
  level: number
): EditorItem[] {
  return allItems
    .filter((i) => i.parentItemId === parentId && i.level === level)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function EstimateItemTree({ showCostPrice }: Props) {
  const { items, updateItem, removeItem, addItem } = useEstimateEditor();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [priceStats, setPriceStats] = useState<{ itemName: string; avgPrice: number; minPrice: number; maxPrice: number; dataPoints: number }[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai/price-intelligence", { signal: controller.signal })
      .then((res) => res.ok ? res.json() : [])
      .then(setPriceStats)
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    return () => controller.abort();
  }, []);

  const isCollapsed = (id: string) => collapsed.has(id);
  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const addChild = (parentId: string | null, level: number) => {
    const count = items.filter(
      (i) => i.parentItemId === parentId && i.level === level
    ).length;
    addItem({
      id: generateTempId(),
      parentItemId: parentId,
      level,
      sortOrder: count,
      itemName: "",
      specification: null,
      quantity: null,
      unit: "式",
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

  const renderRow = (item: EditorItem, depth: number): React.ReactNode => {
    const isHeader = item.level < 4;
    const children = isHeader ? childrenOf(items, item.id, item.level + 1) : [];
    const sectionTotal = isHeader ? calcSectionTotal(items, item.id) : 0;

    return (
      <Fragment key={item.id}>
        {/* ── アイテム行 ─────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-center gap-1 border-b group py-1 pr-2",
            LEVEL_ROW[item.level],
            item.isAlternative && "opacity-60 bg-amber-50/80 border-l-amber-300"
          )}
          style={{ paddingLeft: `${8 + depth * 20}px` }}
        >
          {/* 折りたたみトグル */}
          {isHeader ? (
            <button
              type="button"
              onClick={() => toggleCollapse(item.id)}
              aria-expanded={!isCollapsed(item.id)}
              aria-label={`${item.itemName || LEVEL_LABELS[item.level]}を${isCollapsed(item.id) ? "展開" : "折りたたみ"}`}
              className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {isCollapsed(item.id) ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          {/* 階層バッジ */}
          <span
            className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap",
              LEVEL_BADGE[item.level]
            )}
          >
            {LEVEL_LABELS[item.level]}
          </span>

          {/* 品名 */}
          <Input
            value={item.itemName}
            onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
            placeholder="品名"
            className={cn(
              "h-7 text-xs flex-1 min-w-[60px]",
              item.level === 1 && "font-bold",
              item.level === 2 && "font-semibold",
              item.level === 3 && "font-medium"
            )}
          />

          {/* 規格 */}
          <Input
            value={item.specification ?? ""}
            onChange={(e) =>
              updateItem(item.id, { specification: e.target.value || null })
            }
            placeholder="規格"
            className="h-7 text-xs w-[76px] flex-shrink-0"
          />

          {/* 数量 */}
          <Input
            type="number"
            value={item.quantity ?? ""}
            onChange={(e) =>
              updateItem(item.id, {
                quantity: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            placeholder="数量"
            className="h-7 text-xs w-[56px] flex-shrink-0 text-right"
          />

          {/* 単位 */}
          <Select
            value={item.unit ?? "式"}
            onValueChange={(v) => updateItem(item.id, { unit: v || null })}
          >
            <SelectTrigger className="h-7 w-[48px] text-xs px-1 flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 単価 */}
          <Input
            type="number"
            value={item.unitPrice ?? ""}
            onChange={(e) =>
              updateItem(item.id, {
                unitPrice: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            placeholder="単価"
            className="h-7 text-xs w-[76px] flex-shrink-0 text-right"
          />
          {item.level === 4 && (
            <PriceIndicator
              itemName={item.itemName}
              currentPrice={item.unitPrice}
              priceStats={priceStats}
            />
          )}

          {/* 金額（直接入力分） */}
          <div className="w-[80px] flex-shrink-0 text-right pr-0.5">
            <span
              className={cn(
                "text-xs font-mono tabular-nums",
                item.amount === 0 && "text-muted-foreground/30"
              )}
            >
              {formatCurrency(item.amount)}
            </span>
          </div>

          {/* 原価 */}
          {showCostPrice && (
            <Input
              type="number"
              value={item.costPrice ?? ""}
              onChange={(e) =>
                updateItem(item.id, {
                  costPrice: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="原価"
              className="h-7 text-xs w-[76px] flex-shrink-0 text-right"
            />
          )}

          {/* 小計（階層ヘッダーのみ：直下含む全子孫の合計） */}
          <div className="w-[84px] flex-shrink-0 text-right">
            {isHeader && (item.amount > 0 || sectionTotal > 0) ? (
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                <span className="text-[9px] mr-0.5">計</span>
                {formatCurrency(item.amount + sectionTotal)}
              </span>
            ) : (
              <span />
            )}
          </div>

          {/* アクション */}
          <div className="flex items-center gap-0.5 w-[52px] flex-shrink-0 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {isHeader && (
              <button
                type="button"
                onClick={() => addChild(item.id, item.level + 1)}
                title={`${LEVEL_LABELS[item.level + 1]}を追加`}
                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              title={item.isAlternative ? "代替案 → 通常" : "通常 → 代替案"}
              onClick={() =>
                updateItem(item.id, { isAlternative: !item.isAlternative })
              }
              className={cn(
                "h-5 w-5 flex items-center justify-center rounded transition-colors",
                item.isAlternative
                  ? "bg-amber-200 text-amber-700"
                  : "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
              )}
            >
              <GitBranch className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`${item.itemName || LEVEL_LABELS[item.level]}を削除`}
              className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ── 子アイテム（再帰）+ 追加ボタン ────────────────── */}
        {isHeader && !isCollapsed(item.id) && (
          <>
            {children.map((child) => renderRow(child, depth + 1))}
            {/* 子アイテム追加行 */}
            <div
              className="flex border-b border-dashed border-muted-foreground/15 bg-muted/5"
              style={{ paddingLeft: `${8 + (depth + 1) * 20}px` }}
            >
              <button
                type="button"
                onClick={() => addChild(item.id, item.level + 1)}
                className="flex items-center gap-1.5 py-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-blue-50/50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {LEVEL_LABELS[item.level + 1]}を追加
              </button>
            </div>
          </>
        )}
      </Fragment>
    );
  };

  const rootItems = useMemo(() => childrenOf(items, null, 1), [items]);

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* ── 列ヘッダー ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-muted border-b text-[11px] font-medium text-muted-foreground">
        <div className="w-5 flex-shrink-0" />
        {/* badge area */}
        <div className="w-[42px] flex-shrink-0" />
        <div className="flex-1 min-w-[60px] pl-0.5">品名</div>
        <div className="w-[76px] flex-shrink-0">規格</div>
        <div className="w-[56px] flex-shrink-0 text-right">数量</div>
        <div className="w-[48px] flex-shrink-0 text-center">単位</div>
        <div className="w-[76px] flex-shrink-0 text-right">単価</div>
        <div className="w-[80px] flex-shrink-0 text-right">金額</div>
        {showCostPrice && (
          <div className="w-[76px] flex-shrink-0 text-right">原価</div>
        )}
        <div className="w-[84px] flex-shrink-0 text-right">小計</div>
        <div className="w-[52px] flex-shrink-0" />
      </div>

      {/* ── アイテムリスト ──────────────────────────────────── */}
      {rootItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10">
          <p className="text-sm mb-1">見積明細がありません</p>
          <p className="text-xs opacity-70">
            「工種を追加」ボタンで追加してください
          </p>
        </div>
      ) : (
        rootItems.map((item) => renderRow(item, 0))
      )}
    </div>
  );
}
