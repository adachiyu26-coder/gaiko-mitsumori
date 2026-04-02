"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";
import { unitPriceSchema, type UnitPriceFormData } from "@/lib/validations/unit-price";

export async function createUnitPrice(data: UnitPriceFormData) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");
  const validated = unitPriceSchema.parse(data);

  await prisma.unitPriceMaster.create({
    data: { ...validated, companyId: user.companyId },
  });

  revalidatePath("/master/unit-prices");
}

export async function updateUnitPrice(id: string, data: UnitPriceFormData) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");
  const validated = unitPriceSchema.parse(data);

  const existing = await prisma.unitPriceMaster.findUnique({
    where: { id, companyId: user.companyId },
    select: { unitPrice: true, costPrice: true },
  });

  await prisma.unitPriceMaster.update({
    where: { id, companyId: user.companyId },
    data: validated,
  });

  if (existing && (Number(existing.unitPrice) !== validated.unitPrice ||
      (existing.costPrice != null && validated.costPrice != null && Number(existing.costPrice) !== validated.costPrice))) {
    await prisma.unitPriceHistory.create({
      data: {
        unitPriceMasterId: id,
        previousPrice: existing.unitPrice,
        newPrice: validated.unitPrice,
        previousCost: existing.costPrice,
        newCost: validated.costPrice ?? null,
        changedBy: user.id,
      },
    });
  }

  revalidatePath("/master/unit-prices");
}

export async function toggleUnitPriceActive(id: string, isActive: boolean) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  await prisma.unitPriceMaster.update({
    where: { id, companyId: user.companyId },
    data: { isActive },
  });

  revalidatePath("/master/unit-prices");
}

export async function bulkAdjustPrices(data: {
  categoryId?: string | null;
  adjustType: "unitPrice" | "costPrice" | "both";
  adjustPercent: number;
}) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  if (data.adjustPercent < -50 || data.adjustPercent > 100) {
    throw new Error("調整率は-50%〜100%の範囲で入力してください");
  }

  const where: Record<string, unknown> = {
    companyId: user.companyId,
    isActive: true,
  };
  if (data.categoryId) where.categoryId = data.categoryId;

  const items = await prisma.unitPriceMaster.findMany({ where: where as any });

  const multiplier = 1 + data.adjustPercent / 100;

  const operations = items.flatMap((item) => {
    const updateData: Record<string, unknown> = {};
    if (data.adjustType === "unitPrice" || data.adjustType === "both") {
      updateData.unitPrice = Math.floor(Number(item.unitPrice) * multiplier);
    }
    if ((data.adjustType === "costPrice" || data.adjustType === "both") && item.costPrice) {
      updateData.costPrice = Math.floor(Number(item.costPrice) * multiplier);
    }

    const ops = [
      prisma.unitPriceMaster.update({
        where: { id: item.id },
        data: updateData,
      }),
    ];

    const newPrice = updateData.unitPrice != null ? Number(updateData.unitPrice) : Number(item.unitPrice);
    const newCost = updateData.costPrice != null ? Number(updateData.costPrice) : (item.costPrice != null ? Number(item.costPrice) : null);

    if (Number(item.unitPrice) !== newPrice || (item.costPrice != null && newCost != null && Number(item.costPrice) !== newCost)) {
      ops.push(
        prisma.unitPriceHistory.create({
          data: {
            unitPriceMasterId: item.id,
            previousPrice: item.unitPrice,
            newPrice: newPrice,
            previousCost: item.costPrice,
            newCost: newCost,
            changedBy: user.id,
          },
        }) as any
      );
    }

    return ops;
  });

  await prisma.$transaction(operations);

  revalidatePath("/master/unit-prices");
  return { count: items.length };
}

export async function deleteUnitPrice(id: string) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  await prisma.unitPriceMaster.delete({
    where: { id, companyId: user.companyId },
  });

  revalidatePath("/master/unit-prices");
}

const MAX_CSV_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_CSV_ROWS = 5000;

/** RFC 4180準拠のCSV行パーサー（クォート内カンマ対応） */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function importUnitPricesFromCsv(csvText: string) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  if (new TextEncoder().encode(csvText).length > MAX_CSV_SIZE) {
    throw new Error("CSVファイルは1MB以下にしてください");
  }

  const lines = csvText.trim().split("\n");
  if (lines.length < 2) throw new Error("CSVにデータがありません");

  if (lines.length - 1 > MAX_CSV_ROWS) {
    throw new Error(`一度にインポートできるのは${MAX_CSV_ROWS}件までです`);
  }

  const headers = parseCsvLine(lines[0]);
  const nameIdx = headers.indexOf("品名");
  const specIdx = headers.indexOf("規格");
  const unitIdx = headers.indexOf("単位");
  const priceIdx = headers.indexOf("見積単価");
  const costIdx = headers.indexOf("原価");
  const mfgIdx = headers.indexOf("メーカー");
  const modelIdx = headers.indexOf("型番");

  if (nameIdx === -1 || unitIdx === -1 || priceIdx === -1) {
    throw new Error("必須列（品名、単位、見積単価）が見つかりません");
  }

  const records = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (!cols[nameIdx]) continue;

    const unitPrice = parseFloat(cols[priceIdx]);
    if (isNaN(unitPrice) || unitPrice < 0) {
      errors.push(`行${i + 1}: 見積単価が不正です（${cols[priceIdx]}）`);
      continue;
    }

    let costPrice: number | null = null;
    if (costIdx >= 0 && cols[costIdx]) {
      const parsed = parseFloat(cols[costIdx]);
      if (isNaN(parsed) || parsed < 0) {
        errors.push(`行${i + 1}: 原価が不正です（${cols[costIdx]}）`);
        continue;
      }
      costPrice = Math.floor(parsed);
    }

    records.push({
      companyId: user.companyId,
      itemName: cols[nameIdx],
      specification: specIdx >= 0 ? cols[specIdx] || null : null,
      unit: cols[unitIdx] || "式",
      unitPrice: Math.floor(unitPrice),
      costPrice,
      manufacturer: mfgIdx >= 0 ? cols[mfgIdx] || null : null,
      modelNumber: modelIdx >= 0 ? cols[modelIdx] || null : null,
    });
  }

  if (records.length === 0) {
    throw new Error(
      errors.length > 0
        ? `インポート可能なデータがありません。\n${errors.join("\n")}`
        : "インポート可能なデータがありません"
    );
  }

  await prisma.unitPriceMaster.createMany({ data: records });

  revalidatePath("/master/unit-prices");
  return { count: records.length, errors };
}
