"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { useEstimateEditor, generateTempId } from "@/stores/estimate-editor";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  categories: { id: string; name: string }[];
  showCostPrice: boolean;
}

export function EstimateItemTreeMobile({ categories, showCostPrice }: Props) {
  const store = useEstimateEditor();
  const [focusedParentId, setFocusedParentId] = useState<string | null>(null);

  // Get items at current level
  const currentItems = store.items.filter((i) =>
    focusedParentId ? i.parentItemId === focusedParentId : !i.parentItemId
  ).sort((a, b) => a.sortOrder - b.sortOrder);

  // Get breadcrumb path
  const getBreadcrumb = (): { id: string | null; name: string }[] => {
    const path: { id: string | null; name: string }[] = [{ id: null, name: "工種一覧" }];
    let parentId = focusedParentId;
    const items: { id: string; name: string }[] = [];
    while (parentId) {
      const parent = store.items.find((i) => i.id === parentId);
      if (!parent) break;
      items.unshift({ id: parent.id, name: parent.itemName });
      parentId = parent.parentItemId;
    }
    return [...path, ...items];
  };

  const breadcrumb = getBreadcrumb();
  const currentParent = focusedParentId ? store.items.find((i) => i.id === focusedParentId) : null;
  const currentLevel = currentParent ? currentParent.level + 1 : 1;

  const handleAddItem = () => {
    const levelNames: Record<number, string> = {
      1: "新規工種",
      2: "新規大項目",
      3: "新規中項目",
      4: "新規品名",
    };
    store.addItem({
      id: generateTempId(),
      parentItemId: focusedParentId,
      level: currentLevel,
      sortOrder: currentItems.length,
      itemName: levelNames[currentLevel] ?? "新規項目",
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

  const handleUpdateField = (id: string, field: string, value: unknown) => {
    store.updateItem(id, { [field]: value });
  };

  const handleRemove = (id: string) => {
    store.removeItem(id);
  };

  // Calculate children total
  const getChildrenTotal = (parentId: string): number => {
    return store.items
      .filter((i) => i.parentItemId === parentId && !i.isAlternative)
      .reduce((sum, item) => sum + (item.amount ?? 0) + getChildrenTotal(item.id), 0);
  };

  return (
    <div className="space-y-3">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 text-sm overflow-x-auto pb-1">
        {breadcrumb.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-1 shrink-0">
            {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <button
              type="button"
              onClick={() => setFocusedParentId(crumb.id)}
              className={`text-xs px-1.5 py-0.5 rounded ${
                idx === breadcrumb.length - 1
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Back button for drilled-in views */}
      {focusedParentId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const parent = store.items.find((i) => i.id === focusedParentId);
            setFocusedParentId(parent?.parentItemId ?? null);
          }}
          className="text-xs"
        >
          <ChevronLeft className="h-3 w-3 mr-1" />
          戻る
        </Button>
      )}

      {/* Items */}
      {currentItems.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          項目がありません
        </div>
      ) : (
        <div className="space-y-2">
          {currentItems.map((item) => {
            const hasChildren = store.items.some((i) => i.parentItemId === item.id);
            const childrenTotal = getChildrenTotal(item.id);
            const isDetail = item.level === 4;

            return (
              <Card key={item.id} className={`p-3 ${item.isAlternative ? "opacity-60 border-amber-200" : ""}`}>
                <div className="space-y-2">
                  {/* Item name + navigation */}
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      value={item.itemName}
                      onChange={(e) => handleUpdateField(item.id, "itemName", e.target.value)}
                      className="h-8 text-sm font-medium flex-1"
                    />
                    {!isDetail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFocusedParentId(item.id)}
                        className="shrink-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                      className="shrink-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Detail fields for level 4 */}
                  {isDetail && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">規格</label>
                        <Input
                          value={item.specification ?? ""}
                          onChange={(e) => handleUpdateField(item.id, "specification", e.target.value || null)}
                          className="h-7 text-xs"
                          placeholder="規格"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">数量</label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={item.quantity ?? ""}
                            onChange={(e) => handleUpdateField(item.id, "quantity", e.target.value ? Number(e.target.value) : null)}
                            className="h-7 text-xs flex-1"
                            placeholder="0"
                          />
                          <Input
                            value={item.unit ?? ""}
                            onChange={(e) => handleUpdateField(item.id, "unit", e.target.value || null)}
                            className="h-7 text-xs w-12"
                            placeholder="単位"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">単価</label>
                        <Input
                          type="number"
                          value={item.unitPrice ?? ""}
                          onChange={(e) => handleUpdateField(item.id, "unitPrice", e.target.value ? Number(e.target.value) : null)}
                          className="h-7 text-xs"
                          placeholder="¥0"
                        />
                      </div>
                      {showCostPrice && (
                        <div>
                          <label className="text-[10px] text-muted-foreground">原価</label>
                          <Input
                            type="number"
                            value={item.costPrice ?? ""}
                            onChange={(e) => handleUpdateField(item.id, "costPrice", e.target.value ? Number(e.target.value) : null)}
                            className="h-7 text-xs"
                            placeholder="¥0"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary footer */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {item.isAlternative && <Badge variant="outline" className="text-[10px]">代替案</Badge>}
                      {hasChildren && (
                        <span className="text-muted-foreground">
                          {store.items.filter((i) => i.parentItemId === item.id).length}項目
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-medium">
                      {isDetail && item.amount ? formatCurrency(item.amount) : ""}
                      {!isDetail && childrenTotal > 0 ? formatCurrency(childrenTotal) : ""}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add button */}
      {currentLevel <= 4 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          {currentLevel === 1 ? "工種を追加" : currentLevel === 2 ? "大項目を追加" : currentLevel === 3 ? "中項目を追加" : "品名を追加"}
        </Button>
      )}
    </div>
  );
}
