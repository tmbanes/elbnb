import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const user = await getApiAuthenticatedUser();
  
  const allowedRoles = ["housing_admin", "dormitory_manager", "admin"];
  if (!user || !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: `Forbidden: role ${user?.role} not allowed` }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing document path" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from("application_documents")
    .createSignedUrl(path, 60 * 20); // 20 minutes

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
