import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/menu", "/auth/login", "/auth/register", "/login", "/register", "/daftar"];
const userRoutes = ["/menu", "/checkout", "/waiting", "/profile"];
const adminRoutes = [
  "/dashboard",
  "/orders",
  "/queue",
  "/reports",
  "/manual-cashier",
  "/admin-users",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("sessionToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some((route) => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/menu", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};