/**
 * Notification sending service
 * Supports email (via Resend) and LINE Messaging API
 */

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
}

/** Send email notification */
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Email] Skipped (RESEND_API_KEY not set): ${subject}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "noreply@gaiko-mitsumori.app",
        to,
        subject,
        text: body,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return false;
  }
}

/** Send LINE notification */
export async function sendLine(lineUserId: string, message: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.log(`[LINE] Skipped (LINE_CHANNEL_ACCESS_TOKEN not set): ${message.slice(0, 50)}`);
    return false;
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("[LINE] Send failed:", error);
    return false;
  }
}

/** Send notification through all enabled channels */
export async function sendNotification(
  payload: NotificationPayload,
  options: {
    email?: string;
    emailEnabled?: boolean;
    lineUserId?: string | null;
    lineEnabled?: boolean;
  }
): Promise<void> {
  const { prisma } = await import("@/lib/db/prisma");

  // Email
  if (options.emailEnabled && options.email) {
    const sent = await sendEmail(options.email, payload.title, payload.body);
    await prisma.notificationLog.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        channel: "email",
        title: payload.title,
        body: payload.body,
        isRead: !sent,
      },
    });
  }

  // LINE
  if (options.lineEnabled && options.lineUserId) {
    const message = `${payload.title}\n${payload.body}`;
    const sent = await sendLine(options.lineUserId, message);
    await prisma.notificationLog.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        channel: "line",
        title: payload.title,
        body: payload.body,
        isRead: !sent,
      },
    });
  }
}
