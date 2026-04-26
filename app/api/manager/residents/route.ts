import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLogServer, isUserRole } from "@/services/activity_log/server";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users").select("role").eq("user_id", user.id).single();

    if (!profile || !["dormitory_manager", "housing_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get assigned accommodation (manager_id references dormitory_manager.user_id)
    const { data: accommodation, error: accomError } = await supabase
      .from("accommodation")
      .select("accommodation_id, name, location")
      .eq("manager_id", user.id)
      .single();

    if (accomError || !accommodation) {
      return NextResponse.json({ error: "No accommodation assigned to this manager." }, { status: 404 });
    }

    // Get unit IDs for this accommodation
    const { data: units } = await supabase
      .from("unit").select("unit_id").eq("accommodation_id", accommodation.accommodation_id);

    const unitIds = (units ?? []).map((u) => u.unit_id);
    if (!unitIds.length) {
      return NextResponse.json({ success: true, data: [], accommodation });
    }

    // Query 1: assignments + unit (no users join)
    const { data: assignments, error: assignError } = await supabase
      .from("accommodation_assignment")
      .select(`
        assignment_id, application_id, unit_id, user_id,
        move_in_date, expected_move_out_date, actual_move_out_date, assignment_status,
        unit:unit_id (
          unit_id, unit_number, unit_type,
          accommodation:accommodation_id ( name, location )
        )
      `)
      .in("unit_id", unitIds)
      .order("move_in_date", { ascending: false });

    if (assignError) throw new Error(assignError.message);
    if (!assignments?.length) {
      return NextResponse.json({ success: true, data: [], accommodation });
    }

    // Query 2: user details separately
    const userIds = [...new Set(assignments.map((a) => a.user_id))];
    const { data: usersData, error: usersError } = await supabase
      .from("users").select("user_id, first_name, last_name, email").in("user_id", userIds);

    if (usersError) throw new Error(usersError.message);

    const userMap = new Map((usersData ?? []).map((u) => [u.user_id, u]));
    const data = assignments.map((a) => ({
      ...a,
      users: userMap.get(a.user_id) ?? { first_name: "Unknown", last_name: "", email: "" },
    }));

    return NextResponse.json({ success: true, data, accommodation });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch residents." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users").select("role, first_name, last_name").eq("user_id", user.id).single();

    if (!profile || !["dormitory_manager", "housing_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assignment_id, action, date } = await req.json();
    if (!assignment_id || !action) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    // Verify assignment belongs to manager's accommodation
    const { data: accommodation } = await supabase
      .from("accommodation").select("accommodation_id").eq("manager_id", user.id).single();

    if (!accommodation) {
      return NextResponse.json({ error: "No accommodation assigned." }, { status: 403 });
    }

    const { data: assignment } = await supabase
      .from("accommodation_assignment")
      .select("unit:unit_id ( unit_number, accommodation:accommodation_id ( accommodation_id, name ) )")
      .eq("assignment_id", assignment_id)
      .single();

    const assignmentAccomId = (assignment?.unit as any)?.accommodation?.accommodation_id;
    if (assignmentAccomId !== accommodation.accommodation_id) {
      return NextResponse.json({ error: "Assignment not in your accommodation." }, { status: 403 });
    }

    const accommodationName = (assignment?.unit as any)?.accommodation?.name ?? "Unknown";
    const unitNumber = (assignment?.unit as any)?.unit_number ?? "Unknown";
    const userRole = isUserRole(profile.role) ? profile.role : "guest";

    if (action === "record-move-in") {
      const { error } = await supabase
        .from("accommodation_assignment")
        .update({ assignment_status: "active", move_in_date: date })
        .eq("assignment_id", assignment_id)
        .in("assignment_status", ["waiting_payment", "pending"]);
      if (error) throw new Error(error.message);

      await createActivityLogServer({
        p_user_id: user.id,
        p_action_type: "accept_assignment",
        p_log_desc: `${profile.first_name} ${profile.last_name} recorded move-in for Unit ${unitNumber} in ${accommodationName}`,
        p_entity_type: "assignment",
        p_entity_id: assignment_id,
        p_user_role: userRole,
      });

    } else if (action === "record-move-out") {
      const { error } = await supabase
        .from("accommodation_assignment")
        .update({ assignment_status: "completed", actual_move_out_date: date })
        .eq("assignment_id", assignment_id)
        .eq("assignment_status", "active");
      if (error) throw new Error(error.message);

      await createActivityLogServer({
        p_user_id: user.id,
        p_action_type: "cancel_assignment",
        p_log_desc: `${profile.first_name} ${profile.last_name} recorded move-out for Unit ${unitNumber} in ${accommodationName}`,
        p_entity_type: "assignment",
        p_entity_id: assignment_id,
        p_user_role: userRole,
      });

    } else if (action === "terminate") {
      const { error } = await supabase
        .from("accommodation_assignment")
        .update({ assignment_status: "terminated", actual_move_out_date: date })
        .eq("assignment_id", assignment_id)
        .eq("assignment_status", "active");
      if (error) throw new Error(error.message);

      await createActivityLogServer({
        p_user_id: user.id,
        p_action_type: "terminate_assignment",
        p_log_desc: `${profile.first_name} ${profile.last_name} terminated assignment for Unit ${unitNumber} in ${accommodationName}`,
        p_entity_type: "assignment",
        p_entity_id: assignment_id,
        p_user_role: userRole,
      });

    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Action failed." },
      { status: 500 }
    );
  }
}
