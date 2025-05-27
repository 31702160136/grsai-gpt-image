import { NextResponse } from "next/server";
import { store } from "@/data/base_data";

export function middleware(request) {
  const isLogin = store.get("IsLogin");
  const pathname = request.nextUrl.pathname;

  // Handle root path redirect to default locale
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en", request.url));
  }

  // Check if the path starts with /dashboard
  if (pathname.startsWith("/dashboard") && !isLogin) {
    // Redirect to the root path
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
