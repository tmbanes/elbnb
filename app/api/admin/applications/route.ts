import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLogServer, isUserRole } from "@/services/activity_log/server";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: applications, error: appError } = await supabase
      .from("accommodation_application")
      .select(`
        application_id,
        preferred_accommodation_id,
        preferred_unit_type,
        date_submitted,
        duration_of_stay,
        check_in,
        check_out,
        number_of_companions,
        application_status,
        user_id,
        users (
          first_name,
          last_name,
          email
        ),
        accommodation:preferred_accommodation_id (
          accommodation_id,
          name,
          location,
          unit (
            unit_id,
            unit_number,
            unit_type,
            max_occupancy,
            current_occupancy,
            rental_fee,
            billing_period,
            unit_status
          )
        )
      `)
      .eq("application_status", "pending_admin")
      .order("date_submitted", { ascending: false });

    if (appError) throw new Error(appError.message);

    return NextResponse.json({ applications: applications ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch applications." },
      { status: 500 }
    );
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
      .from("users")
      .select("role, first_name, last_name")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { application_id, action, unit_id } = body as {
      application_id: string;
      action: "approve" | "reject";
      unit_id?: string;
    };

    if (!application_id || !action) {
      return NextResponse.json({ error: "Missing application_id or action." }, { status: 400 });
    }

    if (action === "approve" && !unit_id) {
      return NextResponse.json({ error: "A unit must be selected before approving." }, { status: 400 });
    }

    // Fetch accommodation name for logging
    const { data: appData } = await supabase
      .from("accommodation_application")
      .select(`
        user_id,
        check_in,
        check_out,
        preferred_accommodation_id,
        accommodation: preferred_accommodation_id(name)
      `)
      .eq("application_id", application_id)
      .eq("application_status", "pending_admin")
      .single();

    if (!appData) {
      return NextResponse.json({ error: "Application not found or already processed." }, { status: 404 });
    }

    const accommodationName = (appData as any)?.accommodation?.name ?? "Unknown";
    const userRole = isUserRole(profile.role) ? profile.role : "guest";

    if (action === "reject") {
      const { error } = await supabase
        .from("accommodation_application")
        .update({ application_status: "rejected" })
        .eq("application_id", application_id)
        .eq("application_status", "pending_admin");

      if (error) throw new Error(error.message);

      await createActivityLogServer({
        p_user_id: user.id,
        p_action_type: "reject_application",
        p_log_desc: `${profile.first_name} ${profile.last_name} rejected application in ${accommodationName}`,
        p_entity_type: "application",
        p_entity_id: application_id,
        p_user_role: userRole,
      });

      return NextResponse.json({ success: true, new_status: "rejected" });
    }

    // Approve flow
    const { data: unit, error: unitError } = await supabase
      .from("unit")
      .select("unit_id, max_occupancy, current_occupancy, unit_status")
      .eq("unit_id", unit_id!)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }
    if (unit.current_occupancy >= unit.max_occupancy) {
      return NextResponse.json({ error: "Selected unit is already at full capacity." }, { status: 409 });
    }
    if (unit.unit_status !== "active") {
      return NextResponse.json({ error: "Selected unit is not active." }, { status: 409 });
    }

    // Update application to approved
    const { error: approveError } = await supabase
      .from("accommodation_application")
      .update({ application_status: "approved" })
      .eq("application_id", application_id);

    if (approveError) throw new Error(approveError.message);

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from("accommodation_assignment")
      .insert({
        application_id,
        unit_id: unit_id!,
        user_id: appData.user_id,
        move_in_date: appData.check_in,
        expected_move_out_date: appData.check_out,
        actual_move_out_date: null,
        assignment_status: "waiting_payment",
      })
      .select("assignment_id")
      .single();

    if (assignError) throw new Error(assignError.message);

    // Log application approval
    await createActivityLogServer({
      p_user_id: user.id,
      p_action_type: "approve_application",
      p_log_desc: `${profile.first_name} ${profile.last_name} approved application in ${accommodationName}`,
      p_entity_type: "application",
      p_entity_id: application_id,
      p_user_role: userRole,
    });

    // Log assignment creation
    if (assignment) {
      await createActivityLogServer({
        p_user_id: user.id,
        p_action_type: "create_assignment",
        p_log_desc: `${profile.first_name} ${profile.last_name} created assignment in ${accommodationName}`,
        p_entity_type: "assignment",
        p_entity_id: assignment.assignment_id,
        p_user_role: userRole,
      });
    }

    return NextResponse.json({
      success: true,
      new_status: "approved",
      assignment_status: "waiting_payment",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to process application." },
      { status: 500 }
    );
  }
}
