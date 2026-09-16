import { NextResponse, type NextRequest } from "next/server";

// Routes that require *some* session (including guest).
const PROTECTED_PREFIXES = [
  "/profile/setup",
  "/settings",
  "/messages",
  "/friends",
  "/notifications",
];

// Routes a signed-in user shouldn't see again (they'd just get
// redirected back), so we bounce them to the home page instead.
const AUTH_ONLY_PREFIXES = ["/login", "/register"];

// NOTE: Firebase Auth's session lives in IndexedDB/localStorage on the
// client, not in a cookie by default, so proxy alone cannot verify a
// session server-side without an extra step. This proxy checks for a
// lightweight "session" cookie that AuthProvider sets on the client
// after a successful login (see useAuth.tsx) — treat this as a fast,
// non-authoritative redirect; pages still guard themselves with
// useAuth() for the real check.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.get("cm_session")?.value === "1";
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/setup/:path*",
    "/settings/:path*",
    "/messages/:path*",
    "/friends/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
  ],
};
