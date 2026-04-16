// app/api/admin/housing/managers/available-users/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// GET /api/admin/housing/managers/available-users
// Returns all users with role = 'dormitory_manager'
// that are NOT already in the dormitory_manager table
export async function GET() {
  // Get all user_ids already assigned as managers
  const { data: existing } = await supabaseAdmin
    .from("dormitory_manager")
    .select("user_id");

  const existingIds = (existing ?? [])
    .map((m: any) => m.user_id)
    .filter(Boolean);

  // Get users with dormitory_manager role NOT yet in dormitory_manager table
  let query = supabaseAdmin
    .from("users")
    .select("user_id, first_name, last_name, email")
    .eq("role", "dormitory_manager"); // ← was .neq, now .eq

  if (existingIds.length > 0) {
    query = query.not("user_id", "in", `(${existingIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
