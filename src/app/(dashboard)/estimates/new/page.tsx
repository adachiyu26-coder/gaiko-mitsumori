import { requireUser, canViewCostPrice } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { EstimateForm } from "@/components/estimates/estimate-form";

export default async function NewEstimatePage() {
  const user = await requireUser();

  const [customers, categories, company] = await Promise.all([
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
    />
  );
}
