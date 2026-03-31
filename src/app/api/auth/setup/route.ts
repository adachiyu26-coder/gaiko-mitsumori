import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, email, companyName, userName } = body;

  if (!userId || !email || !companyName || !userName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          abbreviation: companyName.slice(0, 3).toUpperCase(),
        },
      });

      const user = await tx.user.create({
        data: {
          id: userId,
          companyId: company.id,
          name: userName,
          email,
          role: "owner",
        },
      });

      // Create default categories for the company
      const systemCategories = await tx.category.findMany({
        where: { isSystem: true },
      });

      if (systemCategories.length === 0) {
        const defaultCategories = [
          "門まわり",
          "塀・フェンス",
          "カーポート・ガレージ",
          "テラス・デッキ",
          "アプローチ",
          "駐車場・土間コンクリート",
          "植栽・造園",
          "照明・電気",
          "排水・給水",
          "付帯工事",
        ];

        await tx.category.createMany({
          data: defaultCategories.map((name, i) => ({
            name,
            sortOrder: i + 1,
            isSystem: true,
          })),
        });
      }

      return { company, user };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup account" },
      { status: 500 }
    );
  }
}
