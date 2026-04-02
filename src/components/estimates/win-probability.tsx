"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface Factor {
  name: string;
  impact: number;
  description: string;
}

interface Props {
  totalAmount: number;
  grossProfitRate: number;
  customerId: string | null;
}

export function WinProbability({ totalAmount, grossProfitRate, customerId }: Props) {
  const [data, setData] = useState<{
    probability: number | null;
    baseRate: number;
    message: string;
    factors: Factor[];
  } | null>(null);

  useEffect(() => {
    if (totalAmount <= 0) return;

    fetch("/api/ai/win-probability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalAmount, grossProfitRate, customerId }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then(setData)
      .catch(() => {});
  }, [totalAmount, grossProfitRate, customerId]);

  if (!data || data.probability == null) return null;

  const prob = data.probability;
  const color = prob >= 60 ? "text-green-600" : prob >= 40 ? "text-amber-600" : "text-red-600";
  const bgColor = prob >= 60 ? "bg-green-500" : prob >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          AI受注予測
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`text-3xl font-bold ${color}`}>{prob}%</div>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${bgColor} transition-all`} style={{ width: `${prob}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.message}</p>
          </div>
        </div>

        {data.factors.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">分析要因</p>
            {data.factors.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  f.impact > 0 ? "bg-green-500" : f.impact < 0 ? "bg-red-500" : "bg-gray-400"
                }`} />
                <span className="text-muted-foreground">{f.name}:</span>
                <span>{f.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
