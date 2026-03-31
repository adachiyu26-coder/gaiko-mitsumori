"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";
import { unitPriceSchema, type UnitPriceFormData } from "@/lib/validations/unit-price";

export async function createUnitPrice(data: UnitPriceFormData) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("Permission denied");
  const validated = unitPriceSchema.parse(data);

  await prisma.unitPriceMaster.create({
    data: { ...validated, companyId: user.companyId },
  });

  revalidatePath("/master/unit-prices");
}

export async function updateUnitPrice(id: string, data: UnitPriceFormData) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("Permission denied");
  const validated = unitPriceSchema.parse(data);

  await prisma.unitPriceMaster.update({
    where: { id, companyId: user.companyId },
    data: validated,
  });

  revalidatePath("/master/unit-prices");
}

export async function toggleUnitPriceActive(id: string, isActive: boolean) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("Permission denied");

  await prisma.unitPriceMaster.update({
    where: { id, companyId: user.companyId },
    data: { isActive },
  });

  revalidatePath("/master/unit-prices");
}

export async function deleteUnitPrice(id: string) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("Permission denied");

  await prisma.unitPriceMaster.delete({
    where: { id, companyId: user.companyId },
  });

  revalidatePath("/master/unit-prices");
}

export async function importUnitPricesFromCsv(csvText: string) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("Permission denied");

  const lines = csvText.trim().split("\n");
  if (lines.length < 2) throw new Error("CSVにデータがありません");

  const headers = lines[0].split(",").map((h) => h.trim());
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
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (!cols[nameIdx]) continue;

    records.push({
      companyId: user.companyId,
      itemName: cols[nameIdx],
      specification: specIdx >= 0 ? cols[specIdx] || null : null,
      unit: cols[unitIdx] || "式",
      unitPrice: Math.floor(parseFloat(cols[priceIdx])) || 0,
      costPrice: costIdx >= 0 ? (parseFloat(cols[costIdx]) ? Math.floor(parseFloat(cols[costIdx])) : null) : null,
      manufacturer: mfgIdx >= 0 ? cols[mfgIdx] || null : null,
      modelNumber: modelIdx >= 0 ? cols[modelIdx] || null : null,
    });
  }

  if (records.length === 0) throw new Error("インポート可能なデータがありません");

  await prisma.unitPriceMaster.createMany({ data: records });

  revalidatePath("/master/unit-prices");
  return { count: records.length };
}
