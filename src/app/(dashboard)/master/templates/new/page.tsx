import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TemplateFormPage } from "@/components/templates/template-form-page";

export default async function NewTemplatePage() {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) redirect("/master/templates");

  return <TemplateFormPage />;
}
