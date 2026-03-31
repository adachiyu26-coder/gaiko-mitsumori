import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const customer = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!customer) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">顧客情報の編集</h1>
      <CustomerForm
        isEdit
        defaultValues={{
          id: customer.id,
          customerType: customer.customerType as "individual" | "corporate" | "subcontract",
          name: customer.name,
          nameKana: customer.nameKana,
          honorific: customer.honorific,
          postalCode: customer.postalCode,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
          referralSource: customer.referralSource,
          note: customer.note,
        }}
      />
    </div>
  );
}
