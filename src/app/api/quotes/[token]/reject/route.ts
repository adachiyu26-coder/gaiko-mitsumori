import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  const estimate = await prisma.estimate.findUnique({
    where: { shareToken: token },
    select: { id: true, status: true },
  });

  if (!estimate) {
    return NextResponse.json({ error: "見積が見つかりません" }, { status: 404 });
  }

  if (estimate.status !== "submitted") {
    return NextResponse.json({ error: "この見積はお断りできません" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "rejected" },
    }),
    prisma.estimateComment.create({
      data: {
        estimateId: estimate.id,
        authorName: body.name || "お客様",
        authorType: "customer",
        content: "見積をお断りしました。",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
