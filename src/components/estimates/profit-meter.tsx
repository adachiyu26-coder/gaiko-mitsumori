"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEstimateEditor } from "@/stores/estimate-editor";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function ProfitMeter() {
  const { totals } = useEstimateEditor();

  const rate = totals.grossProfitRate;
  const barColor =
    rate < 20 ? "bg-red-500" : rate < 30 ? "bg-yellow-500" : "bg-green-500";
  const barWidth = Math.min(Math.max(rate, 0), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>原価・利益</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>原価合計</span>
          <span className="font-mono">
            {formatCurrency(totals.costSubtotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>粗利</span>
          <span
            className={cn(
              "font-mono font-semibold",
              totals.grossProfit < 0 ? "text-destructive" : ""
            )}
          >
            {formatCurrency(totals.grossProfit)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>粗利率</span>
            <span className="font-mono font-bold text-lg">
              {formatPercent(rate)}
            </span>
          </div>
          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-red-500">20%</span>
            <span className="text-yellow-500">30%</span>
            <span className="text-green-500">50%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
