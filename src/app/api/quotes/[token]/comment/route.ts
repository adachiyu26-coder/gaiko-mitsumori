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
    select: { id: true, createdBy: true },
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

  // Send notification to estimate creator
  try {
    const { sendNotification } = await import("@/lib/notifications/send");
    const creator = await prisma.user.findUnique({
      where: { id: estimate.createdBy },
      include: { notificationPreference: true },
    });
    if (creator) {
      const pref = creator.notificationPreference;
      await sendNotification(
        {
          userId: creator.id,
          type: "customer_action",
          title: `見積にコメントがありました`,
          body: `${body.name || "お客様"}がコメントしました: ${body.content.trim().slice(0, 100)}`,
        },
        {
          email: creator.email,
          emailEnabled: pref?.emailEnabled && pref?.emailCustomerAction,
          lineUserId: pref?.lineUserId,
          lineEnabled: pref?.lineEnabled,
        }
      );
    }
  } catch { /* notification failure should not block the response */ }

  return NextResponse.json({ success: true });
}
