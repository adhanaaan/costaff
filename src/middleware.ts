import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const path = request.nextUrl.pathname

  // Public routes
  if (
    path === "/" ||
    path === "/login" ||
    path === "/signup" ||
    path.startsWith("/join/") ||
    path.startsWith("/api/auth/")
  ) {
    return response
  }

  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
