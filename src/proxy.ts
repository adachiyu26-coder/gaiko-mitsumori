import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Dev mode: skip auth proxy
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const { updateSession } = await import("@/lib/supabase/middleware");
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
