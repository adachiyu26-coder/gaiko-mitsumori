"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditEstimate } from "@/lib/auth";

// Generate document number (PO-YYYYMM-0001 or INV-YYYYMM-0001)
async function generateDocNumber(companyId: string, prefix: string): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const searchPrefix = `${prefix}-${ym}-`;

  // Use the appropriate model based on prefix
  let lastNumber: string | null = null;
  if (prefix === "PO") {
    const last = await prisma.purchaseOrder.findFirst({
      where: { companyId, orderNumber: { startsWith: searchPrefix } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    lastNumber = last?.orderNumber ?? null;
  } else {
    const last = await prisma.invoice.findFirst({
      where: { companyId, invoiceNumber: { startsWith: searchPrefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    lastNumber = last?.invoiceNumber ?? null;
  }

  const seq = lastNumber
    ? parseInt(lastNumber.slice(-4)) + 1
    : 1;
  return `${searchPrefix}${String(seq).padStart(4, "0")}`;
}

// Create purchase order from estimate
export async function createPurchaseOrderFromEstimate(
  estimateId: string,
  data: { supplierName: string; supplierAddress?: string; supplierPhone?: string; supplierEmail?: string; deliveryDate?: string; note?: string }
) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    include: { items: { where: { level: 4, isAlternative: false }, orderBy: { sortOrder: "asc" } } },
  });
  if (!estimate) throw new Error("見積が見つかりません");

  const orderNumber = await generateDocNumber(user.companyId, "PO");

  // Calculate totals from cost prices
  const subtotal = estimate.items.reduce((sum, item) => {
    const cost = item.costPrice ? Number(item.costPrice) : Number(item.unitPrice);
    const qty = item.quantity ? Number(item.quantity) : 0;
    return sum + Math.floor(cost * qty);
  }, 0);
  const taxAmount = Math.floor(subtotal * Number(estimate.taxRate) / 100);

  const po = await prisma.purchaseOrder.create({
    data: {
      companyId: user.companyId,
      estimateId,
      orderNumber,
      supplierName: data.supplierName,
      supplierAddress: data.supplierAddress || null,
      supplierPhone: data.supplierPhone || null,
      supplierEmail: data.supplierEmail || null,
      orderDate: new Date(),
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      note: data.note || null,
      createdBy: user.id,
      items: {
        create: estimate.items.map((item) => ({
          itemName: item.itemName,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.costPrice ?? item.unitPrice,
          amount: Math.floor((item.quantity ? Number(item.quantity) : 0) * Number(item.costPrice ?? item.unitPrice ?? 0)),
        })),
      },
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/po/${po.id}`);
}

// Create invoice from estimate
export async function createInvoiceFromEstimate(
  estimateId: string,
  data: { invoiceType?: string; dueDate?: string; note?: string }
) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    include: {
      items: { where: { level: 4, isAlternative: false }, orderBy: { sortOrder: "asc" } },
      customer: true,
    },
  });
  if (!estimate) throw new Error("見積が見つかりません");

  const invoiceNumber = await generateDocNumber(user.companyId, "INV");

  const inv = await prisma.invoice.create({
    data: {
      companyId: user.companyId,
      estimateId,
      customerId: estimate.customerId,
      invoiceNumber,
      invoiceType: data.invoiceType ?? "invoice",
      invoiceDate: new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      subtotal: estimate.subtotal,
      taxAmount: estimate.taxAmount,
      totalAmount: estimate.totalAmount,
      note: data.note || null,
      createdBy: user.id,
      items: {
        create: estimate.items.map((item) => ({
          itemName: item.itemName,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      },
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/inv/${inv.id}`);
}

export async function updateDocumentStatus(type: "po" | "invoice", id: string, status: string) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  if (type === "po") {
    await prisma.purchaseOrder.update({
      where: { id, companyId: user.companyId },
      data: { status },
    });
  } else {
    await prisma.invoice.update({
      where: { id, companyId: user.companyId },
      data: { status },
    });
  }
  revalidatePath("/documents");
}

export async function markInvoicePaid(id: string, paidAmount: number) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const invoice = await prisma.invoice.findUnique({
    where: { id, companyId: user.companyId },
    select: { totalAmount: true },
  });
  if (!invoice) throw new Error("請求書が見つかりません");

  const status = paidAmount >= Number(invoice.totalAmount) ? "paid" : "partial";

  await prisma.invoice.update({
    where: { id },
    data: { paidAmount, status },
  });
  revalidatePath("/documents");
}
