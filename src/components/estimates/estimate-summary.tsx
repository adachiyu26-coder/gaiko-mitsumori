"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEstimateEditor } from "@/stores/estimate-editor";
import { formatCurrency } from "@/lib/utils/format";

export function EstimateSummary() {
  const { totals, expenseRate, discountType, discountValue, taxRate, setOptions } =
    useEstimateEditor();

  return (
    <Card>
      <CardHeader>
        <CardTitle>集計</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">小計</span>
          <span className="font-mono font-semibold">
            {formatCurrency(totals.subtotal)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">諸経費</span>
            <Input
              type="number"
              value={expenseRate}
              onChange={(e) =>
                setOptions({ expenseRate: parseFloat(e.target.value) || 0 })
              }
              className="h-7 w-16 text-sm text-right"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <span className="font-mono">
            {formatCurrency(totals.expenseAmount)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">値引き</span>
            <Select
              value={discountType}
              onValueChange={(v) =>
                setOptions({ discountType: (v ?? "amount") as "amount" | "rate" })
              }
            >
              <SelectTrigger className="h-7 w-16 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">円</SelectItem>
                <SelectItem value="rate">%</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) =>
                setOptions({
                  discountValue: parseFloat(e.target.value) || 0,
                })
              }
              className="h-7 w-24 text-sm text-right"
            />
          </div>
          <span className="font-mono text-destructive">
            -{formatCurrency(totals.discountAmount)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">消費税</span>
            <Input
              type="number"
              value={taxRate}
              onChange={(e) =>
                setOptions({ taxRate: parseFloat(e.target.value) || 0 })
              }
              className="h-7 w-16 text-sm text-right"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <span className="font-mono">
            {formatCurrency(totals.taxAmount)}
          </span>
        </div>

        <div className="border-t pt-3 flex justify-between items-center">
          <span className="text-lg font-bold">合計</span>
          <span className="text-xl font-bold font-mono">
            {formatCurrency(totals.totalAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
