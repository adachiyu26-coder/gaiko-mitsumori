import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json(pref);
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json();

  const data = {
    emailEnabled: body.emailEnabled ?? true,
    emailExpiryWarning: body.emailExpiryWarning ?? true,
    emailStatusChange: body.emailStatusChange ?? true,
    emailCustomerAction: body.emailCustomerAction ?? true,
    lineEnabled: body.lineEnabled ?? false,
    lineUserId: body.lineUserId || null,
    expiryWarningDays: Math.min(30, Math.max(1, body.expiryWarningDays ?? 7)),
  };

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json({ success: true });
}
