import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireUser();

  const template = await prisma.template.findFirst({
    where: {
      id,
      OR: [{ isSystem: true }, { companyId: user.companyId }],
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({
    id: template.id,
    name: template.name,
    items: template.items.map((item) => ({
      level: item.level,
      sortOrder: item.sortOrder,
      itemName: item.itemName,
      specification: item.specification,
      quantity: item.quantity ? Number(item.quantity) : null,
      unit: item.unit,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
      costPrice: item.costPrice ? Number(item.costPrice) : null,
      categoryId: item.categoryId,
      note: item.note,
    })),
  });
}
