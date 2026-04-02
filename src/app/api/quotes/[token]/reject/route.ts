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
    select: { id: true, status: true, createdBy: true },
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
          title: `見積がお断りされました`,
          body: `${body.name || "お客様"}が見積をお断りしました。`,
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
