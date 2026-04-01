import { requireUser, canViewCostPrice } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { EstimateForm } from "@/components/estimates/estimate-form";

export default async function NewEstimatePage() {
  const user = await requireUser();

  const [customers, categories, company, templates] = await Promise.all([
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
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { defaultTaxRate: true, defaultExpenseRate: true, estimateValidityDays: true },
    }),
    prisma.template.findMany({
      where: {
        OR: [{ isSystem: true }, { companyId: user.companyId }],
      },
      include: { _count: { select: { items: true } } },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);

  // Apply company defaults for new estimates
  const companyDefaults = company ? {
    taxRate: Number(company.defaultTaxRate),
    expenseRate: Number(company.defaultExpenseRate),
    estimateValidityDays: company.estimateValidityDays,
  } : undefined;

  return (
    <EstimateForm
      customers={customers}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      showCostPrice={canViewCostPrice(user.role)}
      companyDefaults={companyDefaults}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        isSystem: t.isSystem,
        isShared: t.isShared,
        _count: t._count,
      }))}
    />
  );
}
