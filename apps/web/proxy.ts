import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "./lib/admin-session";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/sign-in")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token) {
    const session = await verifyAdminSession(token);
    if (session) return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/sign-in";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}
