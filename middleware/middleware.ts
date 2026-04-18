import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const res = NextResponse.next();

  // ── 1. Protected Page Routes ───────────────────────────────────────────────
  const isProtectedRoute =
    pathname.startsWith("/manage") ||
    pathname.startsWith("/accommodations") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/admin");

  if (isProtectedRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login, preserving the intended destination
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return res;
  }

  // ── 2. Admin API Routes (Cookie Auth + Role Check) ─────────────────────────
  if (pathname.startsWith("/api/admin")) {
    // DEV BYPASS — remove before production
    if (process.env.NODE_ENV === "development") {
      return res;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return res;
  }

  // ── 3. General API Routes (Bearer Token Auth) ──────────────────────────────
  if (pathname.startsWith("/api")) {
    // Extract Bearer token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify JWT with Supabase Admin Client
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Pass user info to API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", data.user.id);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/manage/:path*",
    "/manager/:path*",
    "/admin/:path*",
    "/accommodations/:path*",
  ],
};