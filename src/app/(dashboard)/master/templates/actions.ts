"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";

export interface TemplateItemFormData {
  id?: string;
  parentItemId?: string | null;
  level: number;
  sortOrder: number;
  itemName: string;
  specification?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  costPrice?: number | null;
  categoryId?: string | null;
  note?: string | null;
}

export async function createTemplate(data: {
  name: string;
  description?: string | null;
  isShared?: boolean;
  items: TemplateItemFormData[];
}) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  await prisma.template.create({
    data: {
      companyId: user.companyId,
      createdBy: user.id,
      name: data.name,
      description: data.description || null,
      isShared: data.isShared ?? false,
      items: {
        create: data.items.map((item, idx) => ({
          ...(item.id ? { id: item.id } : {}),
          level: item.level,
          parentItemId: item.parentItemId ?? null,
          sortOrder: item.sortOrder ?? idx,
          itemName: item.itemName,
          specification: item.specification || null,
          quantity: item.quantity ?? null,
          unit: item.unit || null,
          unitPrice: item.unitPrice ?? null,
          costPrice: item.costPrice ?? null,
          categoryId: item.categoryId || null,
          note: item.note || null,
        })),
      },
    },
  });

  revalidatePath("/master/templates");
}

export async function updateTemplate(
  templateId: string,
  data: {
    name: string;
    description?: string | null;
    isShared?: boolean;
    items: TemplateItemFormData[];
  }
) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.template.findUnique({
      where: { id: templateId, companyId: user.companyId },
      select: { isSystem: true },
    });
    if (!existing) throw new Error("テンプレートが見つかりません");
    if (existing.isSystem) throw new Error("システムテンプレートは編集できません");

    // Delete old items
    await tx.templateItem.deleteMany({ where: { templateId } });

    // Update template
    await tx.template.update({
      where: { id: templateId, companyId: user.companyId },
      data: {
        name: data.name,
        description: data.description || null,
        isShared: data.isShared ?? false,
      },
    });

    // Create new items
    await tx.templateItem.createMany({
      data: data.items.map((item, idx) => ({
        ...(item.id ? { id: item.id } : {}),
        templateId,
        level: item.level,
        parentItemId: item.parentItemId ?? null,
        sortOrder: item.sortOrder ?? idx,
        itemName: item.itemName,
        specification: item.specification || null,
        quantity: item.quantity ?? null,
        unit: item.unit || null,
        unitPrice: item.unitPrice ?? null,
        costPrice: item.costPrice ?? null,
        categoryId: item.categoryId || null,
        note: item.note || null,
      })),
    });
  });

  revalidatePath("/master/templates");
}

export async function deleteTemplate(templateId: string) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  const template = await prisma.template.findUnique({
    where: { id: templateId, companyId: user.companyId },
    select: { isSystem: true },
  });
  if (!template) throw new Error("テンプレートが見つかりません");
  if (template.isSystem) throw new Error("システムテンプレートは削除できません");

  await prisma.template.delete({
    where: { id: templateId, companyId: user.companyId },
  });

  revalidatePath("/master/templates");
}

export async function saveEstimateAsTemplate(
  estimateId: string,
  name: string,
  description?: string | null
) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) throw new Error("権限がありません");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!estimate) throw new Error("見積が見つかりません");

  // Remap parentItemId references using new UUIDs
  const idMap = new Map<string, string>();
  const crypto = await import("crypto");
  for (const item of estimate.items) {
    idMap.set(item.id, crypto.randomUUID());
  }

  await prisma.template.create({
    data: {
      companyId: user.companyId,
      createdBy: user.id,
      name,
      description: description || null,
      items: {
        create: estimate.items.map((item) => ({
          id: idMap.get(item.id)!,
          level: item.level,
          parentItemId: item.parentItemId
            ? idMap.get(item.parentItemId) ?? null
            : null,
          sortOrder: item.sortOrder,
          itemName: item.itemName,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          categoryId: item.categoryId,
          note: item.note,
        })),
      },
    },
  });

  revalidatePath("/master/templates");
}

export async function getTemplates() {
  const user = await requireUser();

  const templates = await prisma.template.findMany({
    where: {
      OR: [
        { isSystem: true },
        { companyId: user.companyId },
      ],
    },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: [
      { isSystem: "desc" },
      { name: "asc" },
    ],
  });

  return templates;
}
