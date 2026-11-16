import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = (req.nextauth.token as any)?.role;

    // Admin routes — admin only
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Dashboard routes — agents, developers, admins only
    if (
      pathname.startsWith("/dashboard") &&
      !["agent", "developer", "admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run middleware if there's a token (i.e. user is logged in)
      // If no token, withAuth redirects to signIn page automatically
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/account/:path*", "/saved/:path*", "/billing/:path*"],
};
