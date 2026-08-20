import { NextRequest, NextResponse } from "next/server";

const PUBLIC = new Set(["/login"]);

export function proxy(request: NextRequest) {
  if (process.env.OUTREACH_MOCK_AUTH !== "0") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("outreach_session")?.value;
  const isPublic = PUBLIC.has(pathname);

  if (!session && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
