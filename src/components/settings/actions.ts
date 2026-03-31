"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canManageUsers } from "@/lib/auth";

export async function updateCompanySettings(data: {
  id: string;
  name: string;
  nameKana?: string | null;
  abbreviation?: string | null;
  postalCode?: string | null;
  address?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  defaultTaxRate: number;
  defaultExpenseRate: number;
  estimateValidityDays: number;
}) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("Permission denied");

  await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name: data.name,
      nameKana: data.nameKana || null,
      abbreviation: data.abbreviation || null,
      postalCode: data.postalCode || null,
      address: data.address || null,
      phone: data.phone || null,
      fax: data.fax || null,
      email: data.email || null,
      website: data.website || null,
      registrationNumber: data.registrationNumber || null,
      defaultTaxRate: data.defaultTaxRate,
      defaultExpenseRate: data.defaultExpenseRate,
      estimateValidityDays: data.estimateValidityDays,
    },
  });

  revalidatePath("/settings");
}
