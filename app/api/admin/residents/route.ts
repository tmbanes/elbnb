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

    if (!profile || profile.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query 1: assignments + unit + accommodation (no users join to avoid RLS filtering)
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
      .order("move_in_date", { ascending: false });

    if (assignError) throw new Error(assignError.message);
    if (!assignments?.length) {
      return NextResponse.json({ success: true, data: [], accommodations: [] });
    }

    // Query 2: user details separately (avoids RLS join filtering)
    const userIds = [...new Set(assignments.map((a) => a.user_id))];
    const { data: usersData, error: usersError } = await supabase
      .from("users").select("user_id, first_name, last_name, email").in("user_id", userIds);

    if (usersError) throw new Error(usersError.message);

    const userMap = new Map((usersData ?? []).map((u) => [u.user_id, u]));
    const data = assignments.map((a) => ({
      ...a,
      users: userMap.get(a.user_id) ?? { first_name: "Unknown", last_name: "", email: "" },
    }));

    // Derive accommodation list for filter dropdown
    const seen = new Set<string>();
    const accommodations = data
      .map((r: any) => r.unit?.accommodation?.name)
      .filter((name: string) => name && !seen.has(name) && seen.add(name))
      .map((name: string) => ({ accommodation_id: name, name }));

    return NextResponse.json({ success: true, data, accommodations });
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

    if (!profile || profile.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assignment_id, action, date, details } = await req.json();
    if (!assignment_id || !action) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    // Fetch assignment details for logging
    const { data: assignmentData } = await supabase
      .from("accommodation_assignment")
      .select("unit:unit_id ( unit_number, accommodation:accommodation_id ( name ) )")
      .eq("assignment_id", assignment_id)
      .single();

    const accommodationName = (assignmentData?.unit as any)?.accommodation?.name ?? "Unknown";
    const unitNumber = (assignmentData?.unit as any)?.unit_number ?? "Unknown";
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

    } else if (action === "override") {
      if (!details?.targetUnit) {
        return NextResponse.json({ error: "Target unit required." }, { status: 400 });
      }
      const { data: targetUnit, error: unitError } = await supabase
        .from("unit")
        .select("unit_id, current_occupancy, max_occupancy, unit_number")
        .eq("unit_number", Number(details.targetUnit))
        .single();

      if (unitError || !targetUnit) {
        return NextResponse.json({ error: `Unit "${details.targetUnit}" not found.` }, { status: 404 });
      }
      if (targetUnit.current_occupancy >= targetUnit.max_occupancy) {
        return NextResponse.json({ error: "Unit is at full capacity." }, { status: 409 });
      }

      const { error } = await supabase
        .from("accommodation_assignment")
        .update({ unit_id: targetUnit.unit_id })
        .eq("assignment_id", assignment_id);
      if (error) throw new Error(error.message);

      await createActivityLogServer({
        p_user_id: user.id,
        p_action_type: "reassign_assignment",
        p_log_desc: `${profile.first_name} ${profile.last_name} transferred resident from Unit ${unitNumber} to Unit ${targetUnit.unit_number} in ${accommodationName}`,
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
