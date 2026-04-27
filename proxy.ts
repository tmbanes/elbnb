import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Quick bypass for public/auth routes BEFORE expensive Auth logic
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/signup") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // 2. Optimization: Check for session cookie existence before calling getUser()
  // This avoids a network trip to Supabase for truly unauthenticated requests on protected routes
  const hasSession = req.cookies.get("sb-access-token") || req.cookies.get("supabase-auth-token");
  
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
          cookiesToSet.forEach(({ name, value, options }) =>
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
  // This is only called for routes that aren't public
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Protected UI Routes
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
      const onboardingUrl = new URL("/onboarding", req.url);
      onboardingUrl.searchParams.set("next", pathname);
      const redirectRes = NextResponse.redirect(onboardingUrl);
      req.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie.name, cookie.value);
      });
      return redirectRes;
    }

    const role = user.user_metadata?.role;

    if (pathname.startsWith("/admin") && role !== "housing_admin") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    if (pathname.startsWith("/manager") && role !== "dormitory_manager") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    if (pathname.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    if (pathname.startsWith("/guest") && role !== "guest") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // 5. Protected API Routes
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/manager") || pathname.startsWith("/api/student")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (pathname.startsWith("/api/admin")) {
      const role = user.user_metadata?.role;
      const isDocumentUrl = pathname === "/api/admin/applications/document-url";
      
      if (role !== "housing_admin" && !(isDocumentUrl && role === "dormitory_manager")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
