import { notFound } from "next/navigation";
import { requireUser, canViewCostPrice } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { EstimateForm } from "@/components/estimates/estimate-form";

export default async function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [estimate, customers, categories] = await Promise.all([
    prisma.estimate.findUnique({
      where: { id, companyId: user.companyId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.customer.findMany({
      where: { companyId: user.companyId },
      select: { id: true, name: true, honorific: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: {
        OR: [{ companyId: user.companyId }, { isSystem: true }],
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!estimate) notFound();

  return (
    <EstimateForm
      isEdit
      estimateId={id}
      estimateVersion={estimate.version}
      estimateStatus={estimate.status}
      customers={customers}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      showCostPrice={canViewCostPrice(user.role)}
      defaultValues={{
        title: estimate.title,
        customerId: estimate.customerId,
        siteAddress: estimate.siteAddress,
        estimateDate: estimate.estimateDate
          ? new Date(estimate.estimateDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        expiryDate: estimate.expiryDate
          ? new Date(estimate.expiryDate).toISOString().slice(0, 10)
          : null,
        expenseRate: Number(estimate.expenseRate),
        discountType: estimate.discountType as "amount" | "rate",
        discountValue: Number(estimate.discountValue),
        taxRate: Number(estimate.taxRate),
        note: estimate.note,
        internalMemo: estimate.internalMemo,
        paymentTerms: estimate.paymentTerms,
        items: estimate.items.map((item) => ({
          id: item.id,
          parentItemId: item.parentItemId,
          level: item.level,
          sortOrder: item.sortOrder,
          itemName: item.itemName,
          specification: item.specification,
          quantity: item.quantity ? Number(item.quantity) : null,
          unit: item.unit,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
          costPrice: item.costPrice ? Number(item.costPrice) : null,
          amount: Number(item.amount),
          costAmount: Number(item.costAmount),
          categoryId: item.categoryId,
          unitPriceMasterId: item.unitPriceMasterId,
          note: item.note,
          isAlternative: item.isAlternative,
        })),
      }}
    />
  );
}
