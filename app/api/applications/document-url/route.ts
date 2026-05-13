import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { withRole } from "@/lib/auth/api-guard";

export const GET = withRole(['housing_admin', 'dormitory_manager', 'admin'], async (req: NextRequest) => {
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
});
