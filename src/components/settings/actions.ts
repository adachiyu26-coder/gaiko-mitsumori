"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canManageUsers } from "@/lib/auth";

const VALID_ROLES = ["owner", "manager", "staff", "viewer"];

export async function updateUserRole(userId: string, role: string) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("権限がありません");
  if (userId === user.id) throw new Error("自分自身のロールは変更できません");
  if (!VALID_ROLES.includes(role)) throw new Error("無効なロールです");

  await prisma.user.update({
    where: { id: userId, companyId: user.companyId },
    data: { role },
  });

  revalidatePath("/settings");
}

export async function deactivateUser(userId: string) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("権限がありません");
  if (userId === user.id) throw new Error("自分自身は無効にできません");

  await prisma.user.update({
    where: { id: userId, companyId: user.companyId },
    data: { isActive: false },
  });

  revalidatePath("/settings");
}

export async function activateUser(userId: string) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("権限がありません");

  await prisma.user.update({
    where: { id: userId, companyId: user.companyId },
    data: { isActive: true },
  });

  revalidatePath("/settings");
}

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
  if (!canManageUsers(user.role)) throw new Error("権限がありません");

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
