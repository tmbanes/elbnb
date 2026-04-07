// /middleware/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// Allowed roles for each path
const roleMap: Record<string, string[]> = {
  "/api/admin": ["housing_admin"],
  "/api/manager": ["dormitory_manager"],
  "/api/student": ["student"],
  "/api/guest": ["guest"]
  // We can add more paths and roles
};

export async function middleware(req: NextRequest) {
  // Only protect /api routes
  if (!req.nextUrl.pathname.startsWith("/api")) return NextResponse.next();

  // Get token from Authorization header
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Verify JWT using Supabase Admin client
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const userId = userData.user.id;

  // Fetch role from the database
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("users")
    .select("role") 
    .eq("id", userId)
    .single();

  if (roleError || !roleData) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userRole = roleData.role;

  // Check if role is allowed for this path
  const allowedRoles = Object.entries(roleMap)
    .filter(([path]) => req.nextUrl.pathname.startsWith(path))
    .flatMap(([, roles]) => roles);

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Pass user info to route handlers via headers
  const response = NextResponse.next();
  response.headers.set("x-user-id", userId);
  response.headers.set("x-user-role", userRole);

  return response;
}

// Apply middleware to all API routes
export const config = {
  matcher: "/api/:path*",
};