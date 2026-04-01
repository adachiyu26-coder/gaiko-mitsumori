import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "コメントを入力してください" }, { status: 400 });
  }

  const estimate = await prisma.estimate.findUnique({
    where: { shareToken: token },
    select: { id: true },
  });

  if (!estimate) {
    return NextResponse.json({ error: "見積が見つかりません" }, { status: 404 });
  }

  await prisma.estimateComment.create({
    data: {
      estimateId: estimate.id,
      authorName: body.name || "お客様",
      authorType: "customer",
      content: body.content.trim(),
    },
  });

  return NextResponse.json({ success: true });
}
