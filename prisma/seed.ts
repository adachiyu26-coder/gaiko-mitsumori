import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create system categories
  const categories = [
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

  for (let i = 0; i < categories.length; i++) {
    await prisma.category.upsert({
      where: { id: `system-cat-${i + 1}` },
      update: {},
      create: {
        id: `system-cat-${i + 1}`,
        name: categories[i],
        sortOrder: i + 1,
        isSystem: true,
      },
    });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
