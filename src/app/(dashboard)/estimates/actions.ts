"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditEstimate, canDeleteEstimate } from "@/lib/auth";
import { generateEstimateNumber } from "@/lib/utils/estimate-number";
import { recalculateEstimate, calculateItemAmount } from "@/lib/utils/calculate";
import { VALID_STATUS_TRANSITIONS, type EstimateStatus } from "@/lib/constants/status";
import type { EstimateItemFormData } from "@/lib/validations/estimate";

export async function createEstimate(data: {
  title: string;
  customerId?: string | null;
  siteAddress?: string | null;
  estimateDate: string;
  expiryDate?: string | null;
  expenseRate: number;
  discountType: "amount" | "rate";
  discountValue: number;
  taxRate: number;
  note?: string | null;
  internalMemo?: string | null;
  paymentTerms?: string | null;
  items: EstimateItemFormData[];
}) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const estimateNumber = await generateEstimateNumber(
    user.companyId,
    user.company.abbreviation
  );

  const itemsForCalc = data.items.map((item) => ({
    level: item.level,
    amount: calculateItemAmount(item.quantity ?? null, item.unitPrice ?? null),
    costAmount: calculateItemAmount(item.quantity ?? null, item.costPrice ?? null),
    isAlternative: item.isAlternative,
  }));

  const totals = recalculateEstimate(itemsForCalc, {
    expenseRate: data.expenseRate,
    discountType: data.discountType,
    discountValue: data.discountValue,
    taxRate: data.taxRate,
  });

  const estimate = await prisma.estimate.create({
    data: {
      companyId: user.companyId,
      createdBy: user.id,
      estimateNumber,
      title: data.title,
      customerId: data.customerId || null,
      siteAddress: data.siteAddress || null,
      estimateDate: new Date(data.estimateDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      expenseRate: data.expenseRate,
      discountType: data.discountType,
      discountValue: data.discountValue,
      taxRate: data.taxRate,
      note: data.note || null,
      internalMemo: data.internalMemo || null,
      paymentTerms: data.paymentTerms || null,
      subtotal: totals.subtotal,
      expenseAmount: totals.expenseAmount,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      costSubtotal: totals.costSubtotal,
      grossProfit: totals.grossProfit,
      grossProfitRate: totals.grossProfitRate,
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
          amount: calculateItemAmount(item.quantity ?? null, item.unitPrice ?? null),
          costAmount: calculateItemAmount(item.quantity ?? null, item.costPrice ?? null),
          categoryId: item.categoryId || null,
          unitPriceMasterId: item.unitPriceMasterId || null,
          note: item.note || null,
          isAlternative: item.isAlternative,
        })),
      },
    },
  });

  revalidatePath("/estimates");
  revalidatePath("/dashboard");
  redirect(`/estimates/${estimate.id}`);
}

export async function updateEstimate(
  estimateId: string,
  data: {
    title: string;
    customerId?: string | null;
    siteAddress?: string | null;
    estimateDate: string;
    expiryDate?: string | null;
    status?: string;
    expenseRate: number;
    discountType: "amount" | "rate";
    discountValue: number;
    taxRate: number;
    note?: string | null;
    internalMemo?: string | null;
    paymentTerms?: string | null;
    version?: number;
    items: EstimateItemFormData[];
  }
) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const itemsForCalc = data.items.map((item) => ({
    level: item.level,
    amount: calculateItemAmount(item.quantity ?? null, item.unitPrice ?? null),
    costAmount: calculateItemAmount(item.quantity ?? null, item.costPrice ?? null),
    isAlternative: item.isAlternative,
  }));

  const totals = recalculateEstimate(itemsForCalc, {
    expenseRate: data.expenseRate,
    discountType: data.discountType,
    discountValue: data.discountValue,
    taxRate: data.taxRate,
  });

  await prisma.$transaction(async (tx) => {
    // 楽観的ロック: バージョンチェック
    if (data.version != null) {
      const current = await tx.estimate.findUnique({
        where: { id: estimateId, companyId: user.companyId },
        select: { version: true },
      });
      if (!current) throw new Error("見積が見つかりません");
      if (current.version !== data.version) {
        throw new Error("他のユーザーが変更を保存しています。ページを再読み込みしてください。");
      }
    }

    // Delete old items
    await tx.estimateItem.deleteMany({ where: { estimateId } });

    // Update estimate
    await tx.estimate.update({
      where: { id: estimateId, companyId: user.companyId },
      data: {
        title: data.title,
        customerId: data.customerId || null,
        siteAddress: data.siteAddress || null,
        estimateDate: new Date(data.estimateDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: data.status || undefined,
        expenseRate: data.expenseRate,
        discountType: data.discountType,
        discountValue: data.discountValue,
        taxRate: data.taxRate,
        note: data.note || null,
        internalMemo: data.internalMemo || null,
        paymentTerms: data.paymentTerms || null,
        subtotal: totals.subtotal,
        expenseAmount: totals.expenseAmount,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        costSubtotal: totals.costSubtotal,
        grossProfit: totals.grossProfit,
        grossProfitRate: totals.grossProfitRate,
        version: { increment: 1 },
      },
    });

    // Create new items
    await tx.estimateItem.createMany({
      data: data.items.map((item, idx) => ({
        ...(item.id ? { id: item.id } : {}),
        estimateId,
        level: item.level,
        parentItemId: item.parentItemId ?? null,
        sortOrder: item.sortOrder ?? idx,
        itemName: item.itemName,
        specification: item.specification || null,
        quantity: item.quantity ?? null,
        unit: item.unit || null,
        unitPrice: item.unitPrice ?? null,
        costPrice: item.costPrice ?? null,
        amount: calculateItemAmount(item.quantity ?? null, item.unitPrice ?? null),
        costAmount: calculateItemAmount(item.quantity ?? null, item.costPrice ?? null),
        categoryId: item.categoryId || null,
        unitPriceMasterId: item.unitPriceMasterId || null,
        note: item.note || null,
        isAlternative: item.isAlternative,
      })),
    });
  });

  revalidatePath("/estimates");
  revalidatePath(`/estimates/${estimateId}`);
  revalidatePath("/dashboard");
}

export async function updateEstimateStatus(
  estimateId: string,
  status: string
) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  // Validate status transition
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    select: { status: true },
  });
  if (!estimate) throw new Error("見積が見つかりません");

  const currentStatus = estimate.status as EstimateStatus;
  const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];
  if (!allowedNext.includes(status as EstimateStatus)) {
    throw new Error(`「${currentStatus}」から「${status}」への変更はできません`);
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "submitted") updateData.submittedAt = new Date();
  if (status === "accepted") updateData.acceptedAt = new Date();

  await prisma.estimate.update({
    where: { id: estimateId, companyId: user.companyId },
    data: updateData,
  });

  revalidatePath("/estimates");
  revalidatePath(`/estimates/${estimateId}`);
  revalidatePath("/dashboard");
}

export async function deleteEstimate(estimateId: string) {
  const user = await requireUser();
  if (!canDeleteEstimate(user.role)) throw new Error("権限がありません");

  await prisma.estimate.delete({
    where: { id: estimateId, companyId: user.companyId },
  });

  revalidatePath("/estimates");
  revalidatePath("/dashboard");
  redirect("/estimates");
}

export async function duplicateEstimate(estimateId: string) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const original = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    include: { items: true },
  });

  if (!original) throw new Error("見積が見つかりません");

  // 会社設定から有効期限日数を取得
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { estimateValidityDays: true },
  });
  const newExpiryDate = new Date();
  newExpiryDate.setDate(newExpiryDate.getDate() + (company?.estimateValidityDays ?? 30));

  const estimateNumber = await generateEstimateNumber(
    user.companyId,
    user.company.abbreviation
  );

  const newEstimate = await prisma.estimate.create({
    data: {
      companyId: user.companyId,
      createdBy: user.id,
      estimateNumber,
      title: `${original.title}（コピー）`,
      customerId: original.customerId,
      siteAddress: original.siteAddress,
      estimateDate: new Date(),
      expiryDate: newExpiryDate,
      status: "draft",
      expenseRate: original.expenseRate,
      discountType: original.discountType,
      discountValue: original.discountValue,
      taxRate: original.taxRate,
      note: original.note,
      internalMemo: original.internalMemo,
      paymentTerms: original.paymentTerms,
      subtotal: original.subtotal,
      expenseAmount: original.expenseAmount,
      discountAmount: original.discountAmount,
      taxAmount: original.taxAmount,
      totalAmount: original.totalAmount,
      costSubtotal: original.costSubtotal,
      grossProfit: original.grossProfit,
      grossProfitRate: original.grossProfitRate,
      items: {
        create: original.items.map((item) => ({
          level: item.level,
          parentItemId: item.parentItemId,
          sortOrder: item.sortOrder,
          itemName: item.itemName,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          amount: item.amount,
          costAmount: item.costAmount,
          categoryId: item.categoryId,
          unitPriceMasterId: item.unitPriceMasterId,
          note: item.note,
          isAlternative: item.isAlternative,
        })),
      },
    },
  });

  revalidatePath("/estimates");
  redirect(`/estimates/${newEstimate.id}/edit`);
}

export async function createNewVersion(estimateId: string) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const original = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    include: { items: true },
  });

  if (!original) throw new Error("見積が見つかりません");

  // Get the latest version number for this estimate number
  const latestVersion = await prisma.estimate.findFirst({
    where: {
      companyId: user.companyId,
      estimateNumber: original.estimateNumber,
    },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const newVersion = (latestVersion?.version ?? original.version) + 1;

  const newEstimate = await prisma.estimate.create({
    data: {
      companyId: user.companyId,
      createdBy: user.id,
      estimateNumber: original.estimateNumber,
      version: newVersion,
      parentEstimateId: original.id,
      title: original.title,
      customerId: original.customerId,
      siteAddress: original.siteAddress,
      estimateDate: new Date(),
      expiryDate: original.expiryDate,
      status: "draft",
      expenseRate: original.expenseRate,
      discountType: original.discountType,
      discountValue: original.discountValue,
      taxRate: original.taxRate,
      note: original.note,
      internalMemo: original.internalMemo,
      paymentTerms: original.paymentTerms,
      subtotal: original.subtotal,
      expenseAmount: original.expenseAmount,
      discountAmount: original.discountAmount,
      taxAmount: original.taxAmount,
      totalAmount: original.totalAmount,
      costSubtotal: original.costSubtotal,
      grossProfit: original.grossProfit,
      grossProfitRate: original.grossProfitRate,
      items: {
        create: original.items.map((item) => ({
          level: item.level,
          parentItemId: item.parentItemId,
          sortOrder: item.sortOrder,
          itemName: item.itemName,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          amount: item.amount,
          costAmount: item.costAmount,
          categoryId: item.categoryId,
          unitPriceMasterId: item.unitPriceMasterId,
          note: item.note,
          isAlternative: item.isAlternative,
        })),
      },
    },
  });

  revalidatePath("/estimates");
  revalidatePath(`/estimates/${estimateId}`);
  redirect(`/estimates/${newEstimate.id}/edit`);
}

export async function shareEstimate(estimateId: string) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    select: { shareToken: true },
  });
  if (!estimate) throw new Error("見積が見つかりません");

  // Generate token if not already shared
  if (estimate.shareToken) {
    return { token: estimate.shareToken };
  }

  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.estimate.update({
    where: { id: estimateId, companyId: user.companyId },
    data: { shareToken: token, sharedAt: new Date() },
  });

  revalidatePath(`/estimates/${estimateId}`);
  return { token };
}
