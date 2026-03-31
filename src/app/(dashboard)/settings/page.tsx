import { requireUser, canManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { UserManagement } from "@/components/settings/user-management";

export default async function SettingsPage() {
  const user = await requireUser();
  const isOwner = canManageUsers(user.role);

  const [company, users] = await Promise.all([
    prisma.company.findUnique({ where: { id: user.companyId } }),
    prisma.user.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!company) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">会社設定</TabsTrigger>
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
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
            logoUrl={company.logoUrl}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー管理</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement
                users={users.map((u) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  isActive: u.isActive,
                }))}
                currentUserId={user.id}
                isOwner={isOwner}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
