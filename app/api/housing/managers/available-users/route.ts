import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { withRole } from "@/lib/auth/api-guard";

export const GET = withRole(['housing_admin', 'admin'], async () => {
  const { data: existing } = await supabaseAdmin.from("dormitory_manager").select("user_id");
  const existingIds = (existing ?? []).map((m: any) => m.user_id).filter(Boolean);

  let query = supabaseAdmin.from("users").select("user_id, first_name, last_name, email").eq("role", "dormitory_manager");
  if (existingIds.length > 0) query = query.not("user_id", "in", `(${existingIds.join(",")})`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
