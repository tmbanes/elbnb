import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const billingId = searchParams.get("billingId");
    if (!billingId) return NextResponse.json({ error: "billingId required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("billing")
      .select(`
        billing_id,
        amount,
        status,
        due_date,
        created_at,
        assignment_id,
        billing_item ( type, amount ),
        accommodation_assignment!inner ( application_id )
      `)
      .eq("billing_id", billingId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: String(error.message ?? error) }, { status: 500 });
    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
