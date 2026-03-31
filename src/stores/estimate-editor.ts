import { create } from "zustand";
import { calculateItemAmount, recalculateEstimate, type EstimateTotals } from "@/lib/utils/calculate";

export interface EditorItem {
  id: string;
  parentItemId: string | null;
  level: number;
  sortOrder: number;
  itemName: string;
  specification: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  costPrice: number | null;
  amount: number;
  costAmount: number;
  categoryId: string | null;
  unitPriceMasterId: string | null;
  note: string | null;
  isAlternative: boolean;
}

interface EstimateEditorState {
  items: EditorItem[];
  expenseRate: number;
  discountType: "amount" | "rate";
  discountValue: number;
  taxRate: number;
  totals: EstimateTotals;
  isDirty: boolean;

  initEditor: (items: EditorItem[], options: { expenseRate: number; discountType: "amount" | "rate"; discountValue: number; taxRate: number }) => void;
  setItems: (items: EditorItem[]) => void;
  setOptions: (opts: Partial<{ expenseRate: number; discountType: "amount" | "rate"; discountValue: number; taxRate: number }>) => void;
  addItem: (item: EditorItem) => void;
  updateItem: (id: string, updates: Partial<EditorItem>) => void;
  removeItem: (id: string) => void;
  moveItem: (id: string, newSortOrder: number) => void;
  recalculate: () => void;
  setDirty: (dirty: boolean) => void;
}

let counter = 0;
export function generateTempId(): string {
  return `temp-${Date.now()}-${counter++}`;
}

const emptyTotals: EstimateTotals = {
  subtotal: 0,
  expenseAmount: 0,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  costSubtotal: 0,
  grossProfit: 0,
  grossProfitRate: 0,
};

export const useEstimateEditor = create<EstimateEditorState>((set, get) => ({
  items: [],
  expenseRate: 10,
  discountType: "amount",
  discountValue: 0,
  taxRate: 10,
  totals: emptyTotals,
  isDirty: false,

  initEditor: (items, options) => {
    set({ items, ...options, isDirty: false });
    get().recalculate();
  },

  setItems: (items) => {
    set({ items });
    get().recalculate();
  },

  setOptions: (opts) => {
    set({ ...opts, isDirty: true });
    get().recalculate();
  },

  addItem: (item) => {
    set((s) => ({ items: [...s.items, item], isDirty: true }));
    get().recalculate();
  },

  updateItem: (id, updates) => {
    set((s) => ({
      items: s.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if ("quantity" in updates || "unitPrice" in updates) {
          updated.amount = calculateItemAmount(updated.quantity, updated.unitPrice);
        }
        if ("quantity" in updates || "costPrice" in updates) {
          updated.costAmount = calculateItemAmount(updated.quantity, updated.costPrice);
        }
        return updated;
      }),
      isDirty: true,
    }));
    get().recalculate();
  },

  removeItem: (id) => {
    set((s) => {
      const toRemove = new Set<string>();
      const collect = (itemId: string) => {
        toRemove.add(itemId);
        s.items.filter((i) => i.parentItemId === itemId).forEach((child) => collect(child.id));
      };
      collect(id);
      return { items: s.items.filter((item) => !toRemove.has(item.id)), isDirty: true };
    });
    get().recalculate();
  },

  moveItem: (id, newSortOrder) => {
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, sortOrder: newSortOrder } : item
      ),
      isDirty: true,
    }));
  },

  recalculate: () => {
    const { items, expenseRate, discountType, discountValue, taxRate } = get();
    const totals = recalculateEstimate(
      items.map((i) => ({
        level: i.level,
        amount: i.amount,
        costAmount: i.costAmount,
        isAlternative: i.isAlternative,
      })),
      { expenseRate, discountType, discountValue, taxRate }
    );
    set({ totals });
  },

  setDirty: (dirty) => set({ isDirty: dirty }),
}));
