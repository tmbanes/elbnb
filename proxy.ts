import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Quick bypass for public/auth routes BEFORE expensive Auth logic
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/signup") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Refresh session and get user
  const { data: { user } } = await supabase.auth.getUser();

  // Helper to determine if request is an API request
  const isApiRequest = pathname.startsWith("/api/") || req.method !== "GET";

  // 4. Protected Routes
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
      if (isApiRequest) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const onboardingUrl = new URL("/onboarding", req.url);
      onboardingUrl.searchParams.set("next", pathname);
      const redirectRes = NextResponse.redirect(onboardingUrl);
      req.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie.name, cookie.value);
      });
      return redirectRes;
    }

    const role = user.user_metadata?.role;

    // Fix: Ensure we check paths securely regardless of nesting (e.g. /dashboard/admin)
    const isAdminRoute = pathname.startsWith("/admin") || pathname.includes("/admin/");
    const isManagerRoute = pathname.startsWith("/manager") || pathname.includes("/manager/");
    const isStudentRoute = pathname.startsWith("/student") || pathname.includes("/student/");
    const isGuestRoute = pathname.startsWith("/guest") || pathname.includes("/guest/");

    if (isAdminRoute && role !== "housing_admin") {
      return isApiRequest
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (isManagerRoute && role !== "dormitory_manager") {
      return isApiRequest
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (isStudentRoute && role !== "student") {
      return isApiRequest
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (isGuestRoute && role !== "guest") {
      return isApiRequest
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
