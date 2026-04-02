import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: body.name.trim() },
  });

  revalidatePath("/settings");
  return NextResponse.json({ success: true });
}
