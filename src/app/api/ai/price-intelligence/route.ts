import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();

  // Get price statistics from accepted estimates for this company
  const priceStats = await prisma.estimateItem.groupBy({
    by: ["itemName"],
    where: {
      estimate: {
        companyId: user.companyId,
        status: { in: ["accepted", "submitted"] },
      },
      level: 4,
      isAlternative: false,
      unitPrice: { not: null },
    },
    _avg: { unitPrice: true, costPrice: true },
    _min: { unitPrice: true },
    _max: { unitPrice: true },
    _count: { _all: true },
    having: {
      unitPrice: { _count: { gte: 2 } }, // Only items with 2+ data points
    },
  });

  const result = priceStats.map((stat) => ({
    itemName: stat.itemName,
    avgPrice: Math.round(Number(stat._avg.unitPrice ?? 0)),
    minPrice: Math.round(Number(stat._min.unitPrice ?? 0)),
    maxPrice: Math.round(Number(stat._max.unitPrice ?? 0)),
    avgCost: stat._avg.costPrice ? Math.round(Number(stat._avg.costPrice)) : null,
    dataPoints: stat._count._all,
  }));

  return NextResponse.json(result);
}
