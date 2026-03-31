"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";
import { customerSchema, type CustomerFormData } from "@/lib/validations/customer";

export async function createCustomer(data: CustomerFormData) {
  const user = await requireUser();
  const validated = customerSchema.parse(data);

  await prisma.customer.create({
    data: {
      ...validated,
      companyId: user.companyId,
    },
  });

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const user = await requireUser();
  const validated = customerSchema.parse(data);

  await prisma.customer.update({
    where: { id, companyId: user.companyId },
    data: validated,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const user = await requireUser();

  await prisma.customer.delete({
    where: { id, companyId: user.companyId },
  });

  revalidatePath("/customers");
  redirect("/customers");
}
