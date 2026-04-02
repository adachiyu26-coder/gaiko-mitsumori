export interface EstimateItemForCalc {
  level: number;
  amount: number;
  costAmount: number;
  isAlternative: boolean;
}

export interface EstimateTotals {
  subtotal: number;
  expenseAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  costSubtotal: number;
  grossProfit: number;
  grossProfitRate: number;
}

export function calculateItemAmount(
  quantity: number | null,
  unitPrice: number | null
): number {
  if (quantity == null || unitPrice == null) return 0;
  if (quantity < 0 || unitPrice < 0) return 0;
  return Math.floor(quantity * unitPrice);
}

export function recalculateEstimate(
  items: EstimateItemForCalc[],
  options: {
    expenseRate: number;
    discountType: "amount" | "rate";
    discountValue: number;
    taxRate: number;
  }
): EstimateTotals {
  // 全レベルの非代替アイテムを集計対象とする（工種・大項目・中項目・品名すべて可）
  const detailItems = items.filter((i) => !i.isAlternative);

  const subtotal = detailItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const costSubtotal = detailItems.reduce(
    (sum, item) => sum + (item.costAmount ?? 0),
    0
  );

  const expenseAmount = Math.floor((subtotal * options.expenseRate) / 100);

  const discountAmount = Math.min(
    subtotal + expenseAmount,
    options.discountType === "amount"
      ? options.discountValue
      : Math.floor(
          ((subtotal + expenseAmount) * options.discountValue) / 100
        )
  );

  const taxableAmount = subtotal + expenseAmount - discountAmount;
  const taxAmount = Math.floor((taxableAmount * options.taxRate) / 100);
  const totalAmount = taxableAmount + taxAmount;

  const grossProfit = taxableAmount - costSubtotal;
  const grossProfitRate =
    taxableAmount > 0
      ? Math.round((grossProfit / taxableAmount) * 1000) / 10
      : 0;

  return {
    subtotal,
    expenseAmount,
    discountAmount,
    taxAmount,
    totalAmount,
    costSubtotal,
    grossProfit,
    grossProfitRate,
  };
}
