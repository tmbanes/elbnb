// app/api/manager/residents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users").select("role").eq("user_id", user.id).single();

    if (!profile || !["dormitory_manager", "housing_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service client to bypass RLS — session client already verified auth + role above
    const serviceSupabase = supabaseAdmin;

    // Get ALL accommodations managed by this user (a manager may manage multiple)
    const { data: accommodations, error: accomError } = await serviceSupabase
      .from("accommodation")
      .select("accommodation_id, name, location")
      .eq("manager_id", user.id);

    if (accomError) {
      return NextResponse.json({ error: accomError.message }, { status: 500 });
    }

    // No accommodations assigned yet — return valid empty state
    if (!accommodations || accommodations.length === 0) {
      return NextResponse.json({ success: true, data: [], accommodations: [] });
    }

    const accommodationIds = accommodations.map((a: any) => a.accommodation_id);

    // Get all unit IDs within all of this manager's accommodations
    const { data: units, error: unitsErr } = await serviceSupabase
      .from("unit")
      .select("unit_id")
      .in("accommodation_id", accommodationIds);

    if (unitsErr) {
      return NextResponse.json({ error: unitsErr.message }, { status: 500 });
    }

    const unitIds = (units ?? []).map((u: any) => u.unit_id);

    if (unitIds.length === 0) {
      return NextResponse.json({ success: true, data: [], accommodations });
    }

    // Fetch only assignments scoped to this manager's units
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
      .in("unit_id", unitIds)
      .order("move_in_date", { ascending: false });

    if (error) {
      console.error("Manager residents fetch error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: assignments ?? [],
      accommodations,
    });
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

    if (!profile || !["dormitory_manager", "housing_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { assignment_id, action, date } = body as {
      assignment_id: string;
      action: string;
      date: string;
    };

    if (!assignment_id || !action) {
      return NextResponse.json({ error: "Missing assignment_id or action" }, { status: 400 });
    }

    // Managers may only record-move-in or record-move-out
    if (!["record-move-in", "record-move-out"].includes(action)) {
      return NextResponse.json(
        { error: "Managers may only record move-in or move-out" },
        { status: 403 }
      );
    }

    // Use service client to bypass RLS — session client already verified auth + role above
    const serviceSupabase = supabaseAdmin;

    // Scope check: verify the assignment belongs to a unit in any of this manager's accommodations
    const { data: managerAccoms } = await serviceSupabase
      .from("accommodation")
      .select("accommodation_id")
      .eq("manager_id", user.id);

    if (!managerAccoms || managerAccoms.length === 0) {
      return NextResponse.json({ error: "No accommodations found for this manager" }, { status: 403 });
    }

    const managerAccomIds = managerAccoms.map((a: any) => a.accommodation_id);

    const { data: assignment } = await serviceSupabase
      .from("accommodation_assignment")
      .select("unit_id, unit:unit_id(accommodation_id)")
      .eq("assignment_id", assignment_id)
      .maybeSingle();

    const assignedAccomId = (assignment?.unit as any)?.accommodation_id;
    if (!assignment || !managerAccomIds.includes(assignedAccomId)) {
      return NextResponse.json({ error: "Assignment does not belong to your accommodations" }, { status: 403 });
    }

    const updateData =
      action === "record-move-in"
        ? { assignment_status: "active", move_in_date: date }
        : { assignment_status: "completed", actual_move_out_date: date };

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
