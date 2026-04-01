import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();

  const items = await prisma.unitPriceMaster.findMany({
    where: { companyId: user.companyId },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { itemName: "asc" }],
  });

  /** CSVフィールドをエスケープ（カンマ・改行・ダブルクォート対応） */
  const escapeCsvField = (value: string | number): string => {
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = "カテゴリ,品名,規格,単位,見積単価,原価,メーカー,型番";
  const rows = items.map((item) =>
    [
      item.category?.name ?? "",
      item.itemName,
      item.specification ?? "",
      item.unit,
      Number(item.unitPrice),
      item.costPrice ? Number(item.costPrice) : "",
      item.manufacturer ?? "",
      item.modelNumber ?? "",
    ].map(escapeCsvField).join(",")
  );

  const bom = "\uFEFF";
  const csv = bom + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="unit-prices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
