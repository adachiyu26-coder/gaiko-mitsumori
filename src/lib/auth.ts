import { prisma } from "@/lib/db/prisma";
import { DEFAULT_SYSTEM_CATEGORIES } from "@/lib/constants/categories";

async function getOrCreateDevUser() {
  // Dev mode: create/return a dummy user + company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "サンプルエクステリア株式会社",
        abbreviation: "SMP",
        postalCode: "123-4567",
        address: "東京都渋谷区神宮前1-1-1",
        phone: "03-1234-5678",
        fax: "03-1234-5679",
        email: "info@sample-exterior.co.jp",
        registrationNumber: "T1234567890123",
      },
    });

    // Create system categories if not exist
    const existing = await prisma.category.count({ where: { isSystem: true } });
    if (existing === 0) {
      await prisma.category.createMany({
        data: DEFAULT_SYSTEM_CATEGORIES.map((name, i) => ({
          name,
          sortOrder: i + 1,
          isSystem: true,
        })),
      });
    }
  }

  let user = await prisma.user.findFirst({ where: { companyId: company.id } });
  if (!user) {
    // Use upsert to avoid unique constraint violation on email
    user = await prisma.user.upsert({
      where: { email: "admin@sample-exterior.co.jp" },
      update: { companyId: company.id },
      create: {
        companyId: company.id,
        name: "管理者ユーザー",
        email: "admin@sample-exterior.co.jp",
        role: "owner",
      },
    });
  }

  return user;
}

export async function getCurrentUser() {
  if (process.env.DEV_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production") {
    const user = await getOrCreateDevUser();
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });
    return { ...user, company: company! };
  }

  // Production: use Supabase auth
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { company: true },
  });

  if (user && !user.isActive) return null;

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }
  return user;
}

export function canViewCostPrice(role: string): boolean {
  return role === "owner" || role === "manager";
}

export function canEditEstimate(role: string): boolean {
  return role !== "viewer";
}

export function canDeleteEstimate(role: string): boolean {
  return role === "owner" || role === "manager";
}

export function canManageUsers(role: string): boolean {
  return role === "owner";
}

export function canEditUnitPriceMaster(role: string): boolean {
  return role === "owner" || role === "manager";
}

export function canEditCustomer(role: string): boolean {
  return role !== "viewer";
}

export function canDeleteCustomer(role: string): boolean {
  return role === "owner" || role === "manager";
}
