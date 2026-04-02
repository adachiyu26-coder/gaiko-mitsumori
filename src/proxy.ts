import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Dev mode: skip auth proxy
  if (process.env.DEV_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Public routes: skip auth
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/api/quotes") ||
    pathname.startsWith("/api/seed")
  ) {
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
