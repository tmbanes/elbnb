import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { withRole } from "@/lib/auth/api-guard";

export const GET = withRole(['student', 'guest', 'housing_admin', 'admin', 'dormitory_manager'], async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing receipt path" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from("payment_receipts")
    .createSignedUrl(path, 60 * 10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, url: data.signedUrl });
});
