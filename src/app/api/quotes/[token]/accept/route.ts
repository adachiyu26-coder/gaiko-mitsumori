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
    select: { id: true, status: true, expiryDate: true, createdBy: true },
  });

  if (!estimate) {
    return NextResponse.json({ error: "見積が見つかりません" }, { status: 404 });
  }

  if (estimate.status !== "submitted") {
    return NextResponse.json({ error: "この見積は承認できません" }, { status: 400 });
  }

  if (estimate.expiryDate && new Date(estimate.expiryDate) < new Date()) {
    return NextResponse.json({ error: "有効期限が切れています" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "accepted", acceptedAt: new Date() },
    }),
    prisma.estimateComment.create({
      data: {
        estimateId: estimate.id,
        authorName: body.name || "お客様",
        authorType: "customer",
        content: "見積を承認しました。",
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
          title: `見積が承認されました`,
          body: `${body.name || "お客様"}が見積を承認しました。`,
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
