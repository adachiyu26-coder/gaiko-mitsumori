import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireUser();

  const history = await prisma.unitPriceHistory.findMany({
    where: {
      unitPriceMasterId: id,
      unitPriceMaster: { companyId: user.companyId },
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(history.map((h) => ({
    id: h.id,
    previousPrice: Number(h.previousPrice),
    newPrice: Number(h.newPrice),
    previousCost: h.previousCost ? Number(h.previousCost) : null,
    newCost: h.newCost ? Number(h.newCost) : null,
    changeReason: h.changeReason,
    changedBy: h.user.name,
    createdAt: h.createdAt.toISOString(),
  })));
}
