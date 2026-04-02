import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json();
  const { totalAmount, grossProfitRate, customerId, categoryIds } = body;

  // Get historical data for this company
  const estimates = await prisma.estimate.findMany({
    where: {
      companyId: user.companyId,
      status: { in: ["accepted", "rejected"] },
    },
    select: {
      status: true,
      totalAmount: true,
      grossProfitRate: true,
      customerId: true,
      items: {
        where: { level: 1 },
        select: { categoryId: true },
      },
    },
  });

  if (estimates.length < 5) {
    return NextResponse.json({
      probability: null,
      message: "予測に十分なデータがありません（最低5件の受注/失注データが必要です）",
      factors: [],
    });
  }

  const total = estimates.length;
  const accepted = estimates.filter((e) => e.status === "accepted").length;
  const baseRate = accepted / total;

  // Factor analysis
  const factors: { name: string; impact: number; description: string }[] = [];

  // 1. Amount factor - compare to historical accepted amounts
  if (totalAmount != null) {
    const acceptedAmounts = estimates
      .filter((e) => e.status === "accepted")
      .map((e) => Number(e.totalAmount));
    const rejectedAmounts = estimates
      .filter((e) => e.status === "rejected")
      .map((e) => Number(e.totalAmount));

    const avgAccepted = acceptedAmounts.length > 0
      ? acceptedAmounts.reduce((a, b) => a + b, 0) / acceptedAmounts.length : 0;
    const avgRejected = rejectedAmounts.length > 0
      ? rejectedAmounts.reduce((a, b) => a + b, 0) / rejectedAmounts.length : 0;

    if (avgAccepted > 0 && avgRejected > 0) {
      const amountRatio = totalAmount / avgAccepted;
      let impact = 0;
      let desc = "";
      if (amountRatio <= 1.1) {
        impact = 0.05;
        desc = `金額が受注平均（¥${Math.round(avgAccepted).toLocaleString()}）に近い`;
      } else if (amountRatio <= 1.3) {
        impact = -0.05;
        desc = `金額が受注平均より${Math.round((amountRatio - 1) * 100)}%高い`;
      } else {
        impact = -0.15;
        desc = `金額が受注平均より${Math.round((amountRatio - 1) * 100)}%高い（注意）`;
      }
      factors.push({ name: "金額", impact, description: desc });
    }
  }

  // 2. Profit margin factor
  if (grossProfitRate != null) {
    const acceptedMargins = estimates
      .filter((e) => e.status === "accepted")
      .map((e) => Number(e.grossProfitRate));
    const avgMargin = acceptedMargins.length > 0
      ? acceptedMargins.reduce((a, b) => a + b, 0) / acceptedMargins.length : 0;

    if (avgMargin > 0) {
      const marginDiff = grossProfitRate - avgMargin;
      let impact = 0;
      let desc = "";
      if (marginDiff <= 5) {
        impact = 0.05;
        desc = `粗利率が受注平均（${avgMargin.toFixed(1)}%）以下`;
      } else if (marginDiff <= 10) {
        impact = -0.05;
        desc = `粗利率が受注平均より${marginDiff.toFixed(1)}pt高い`;
      } else {
        impact = -0.1;
        desc = `粗利率が受注平均より${marginDiff.toFixed(1)}pt高い（高すぎる可能性）`;
      }
      factors.push({ name: "粗利率", impact, description: desc });
    }
  }

  // 3. Repeat customer factor
  if (customerId) {
    const customerEstimates = estimates.filter((e) => e.customerId === customerId);
    const customerAccepted = customerEstimates.filter((e) => e.status === "accepted").length;
    if (customerEstimates.length > 0) {
      const customerRate = customerAccepted / customerEstimates.length;
      const impact = customerRate > baseRate ? 0.1 : customerRate < baseRate ? -0.05 : 0;
      factors.push({
        name: "顧客実績",
        impact,
        description: `この顧客の過去受注率: ${Math.round(customerRate * 100)}%（${customerAccepted}/${customerEstimates.length}件）`,
      });
    } else {
      factors.push({
        name: "顧客実績",
        impact: 0,
        description: "この顧客との取引実績なし（新規顧客）",
      });
    }
  }

  // Calculate final probability
  const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);
  const probability = Math.max(5, Math.min(95, Math.round((baseRate + totalImpact) * 100)));

  return NextResponse.json({
    probability,
    baseRate: Math.round(baseRate * 100),
    message: `過去${total}件のデータに基づく予測`,
    factors,
  });
}
