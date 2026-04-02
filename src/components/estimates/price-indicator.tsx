"use client";

import { useMemo } from "react";

interface PriceStat {
  itemName: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  dataPoints: number;
}

interface Props {
  itemName: string;
  currentPrice: number | null;
  priceStats: PriceStat[];
}

export function PriceIndicator({ itemName, currentPrice, priceStats }: Props) {
  const stat = useMemo(
    () => priceStats.find((s) => s.itemName === itemName),
    [itemName, priceStats]
  );

  if (!stat || currentPrice == null || currentPrice === 0) return null;

  const deviation = ((currentPrice - stat.avgPrice) / stat.avgPrice) * 100;
  const absDeviation = Math.abs(deviation);

  let color: string;
  let title: string;

  if (absDeviation <= 10) {
    color = "bg-green-500";
    title = `適正範囲（平均¥${stat.avgPrice.toLocaleString()}、${stat.dataPoints}件の実績）`;
  } else if (absDeviation <= 25) {
    color = "bg-amber-500";
    title = `平均${deviation > 0 ? "+" : ""}${Math.round(deviation)}%（平均¥${stat.avgPrice.toLocaleString()}、範囲¥${stat.minPrice.toLocaleString()}〜¥${stat.maxPrice.toLocaleString()}）`;
  } else {
    color = "bg-red-500";
    title = `平均${deviation > 0 ? "+" : ""}${Math.round(deviation)}%（平均¥${stat.avgPrice.toLocaleString()}、範囲¥${stat.minPrice.toLocaleString()}〜¥${stat.maxPrice.toLocaleString()}）`;
  }

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color} shrink-0 cursor-help`}
      title={title}
    />
  );
}
