import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // Not logged in → redirect to login
  if (!session && (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/discover") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profile") ||
    pathname === "/verify" ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/onboarding")
    
  )) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in → redirect away from login/signup
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/discover/:path*",
    "/projects/:path*",
    "/teams/:path*",
    "/match/:path*",
    "/matches/:path*",
    "/profile/:path*",
    "/chat/:path*",
    "/onboarding",
    "/login",
    "/signup",
    "/user/:path*",
  ],
};