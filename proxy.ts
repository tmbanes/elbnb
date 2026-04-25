import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Create supabase client to handle auth cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session and get user early
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Unauthenticated API and Auth Routes (bypass protection)
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return res;
  }

  // 2. Protected UI Routes
  const isProtectedUIRoute =
    pathname.startsWith("/manage") ||
    pathname.startsWith("/accommodations") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/guest") ||
    pathname.startsWith("/dashboard");

  if (isProtectedUIRoute) {
    if (!user) {
      // Redirect to login, preserving the intended destination
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = user.user_metadata?.role;

    // Fast path-to-role enforcement using user metadata to avoid waiting for UI Layout checks
    if (pathname.startsWith("/admin") && role !== "housing_admin") {
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }
    if (pathname.startsWith("/manager") && role !== "dormitory_manager") {
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }
    if (pathname.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }
    if (pathname.startsWith("/guest") && role !== "guest") {
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }
  }

  // 3. Admin API Routes
  if (pathname.startsWith("/api/admin")) {
    if (process.env.NODE_ENV === "development") {
      return res; // Dev bypass
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check without DB query (relying on JWT)
    if (user.user_metadata?.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Apply middleware to all routes except Next.js static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
