import { notFound, redirect } from "next/navigation";
import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { TemplateFormPage } from "@/components/templates/template-form-page";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) redirect("/master/templates");

  const template = await prisma.template.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!template) notFound();
  if (template.isSystem) redirect(`/master/templates/${id}`);

  const defaultValues = {
    name: template.name,
    description: template.description ?? "",
    isShared: template.isShared,
    items: template.items.map((item) => ({
      id: item.id,
      level: item.level,
      itemName: item.itemName,
      specification: item.specification ?? "",
      quantity: item.quantity != null ? String(item.quantity) : "",
      unit: item.unit ?? "",
      unitPrice: item.unitPrice != null ? String(item.unitPrice) : "",
      costPrice: item.costPrice != null ? String(item.costPrice) : "",
    })),
  };

  return <TemplateFormPage templateId={id} defaultValues={defaultValues} />;
}
