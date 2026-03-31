import { requireUser, canManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const isOwner = canManageUsers(user.role);

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });

  if (!company) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <CompanySettingsForm
        company={{
          id: company.id,
          name: company.name,
          nameKana: company.nameKana,
          abbreviation: company.abbreviation,
          postalCode: company.postalCode,
          address: company.address,
          phone: company.phone,
          fax: company.fax,
          email: company.email,
          website: company.website,
          registrationNumber: company.registrationNumber,
          defaultTaxRate: Number(company.defaultTaxRate),
          defaultExpenseRate: Number(company.defaultExpenseRate),
          estimateValidityDays: company.estimateValidityDays,
        }}
        isOwner={isOwner}
      />
    </div>
  );
}
