// app/api/admin/residents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users").select("role").eq("user_id", user.id).single();

    if (!profile || profile.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service client to bypass RLS — session client already verified auth + role above
    const serviceSupabase = createSupabaseServiceClient();

    // Fetch ALL assignments across ALL accommodations with full joins
    const { data: assignments, error } = await serviceSupabase
      .from("accommodation_assignment")
      .select(`
        assignment_id,
        application_id,
        unit_id,
        user_id,
        move_in_date,
        expected_move_out_date,
        actual_move_out_date,
        assignment_status,
        users:user_id (
          first_name, last_name, email, profile_picture_url
        ),
        unit:unit_id (
          unit_id, unit_number, unit_type,
          accommodation:accommodation_id (
            accommodation_id, name, location
          )
        )
      `)
      .order("move_in_date", { ascending: false });

    if (error) {
      console.error("Admin residents fetch error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: assignments ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users").select("role").eq("user_id", user.id).single();

    if (!profile || profile.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service client to bypass RLS — session client already verified auth + role above
    const serviceSupabase = createSupabaseServiceClient();

    const body = await req.json();
    const { assignment_id, action, date, details } = body as {
      assignment_id: string;
      action: "record-move-in" | "record-move-out" | "terminate" | "override";
      date: string;
      details?: { targetUnit?: string };
    };

    if (!assignment_id || !action) {
      return NextResponse.json({ error: "Missing assignment_id or action" }, { status: 400 });
    }

    let updateData: Record<string, any> = {};

    if (action === "record-move-in") {
      updateData = { assignment_status: "active", move_in_date: date };

    } else if (action === "record-move-out") {
      updateData = { assignment_status: "completed", actual_move_out_date: date };

    } else if (action === "terminate") {
      updateData = { assignment_status: "terminated", actual_move_out_date: date };

    } else if (action === "override") {
      if (!details?.targetUnit) {
        return NextResponse.json({ error: "Target unit number is required for override" }, { status: 400 });
      }
      // Resolve unit number → unit_id
      const { data: targetUnit, error: unitErr } = await serviceSupabase
        .from("unit")
        .select("unit_id")
        .eq("unit_number", details.targetUnit)
        .maybeSingle();

      if (unitErr || !targetUnit) {
        return NextResponse.json(
          { error: `Unit '${details.targetUnit}' not found` },
          { status: 404 }
        );
      }
      updateData = { unit_id: targetUnit.unit_id };

    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { error: updateErr } = await serviceSupabase
      .from("accommodation_assignment")
      .update(updateData)
      .eq("assignment_id", assignment_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
