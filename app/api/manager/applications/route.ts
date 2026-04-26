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

    if (!profile || !["dormitory_manager", "housing_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: accommodation, error: accomError } = await supabase
      .from("accommodation")
      .select("accommodation_id, name")
      .eq("manager_id", user.id)
      .single();

    if (accomError || !accommodation) {
      return NextResponse.json({ error: "No accommodation assigned to this manager." }, { status: 404 });
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
        )
      `)
      .eq("preferred_accommodation_id", accommodation.accommodation_id)
      .eq("application_status", "pending_dorm_manager")
      .order("date_submitted", { ascending: false });

    if (appError) throw new Error(appError.message);

    return NextResponse.json({ accommodation, applications: applications ?? [] });
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

    if (!profile || !["dormitory_manager", "housing_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { application_id, action } = body as { application_id: string; action: "forward" | "reject" };

    if (!application_id || !action || !["forward", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const newStatus = action === "forward" ? "pending_admin" : "rejected";

    const { error } = await supabase
      .from("accommodation_application")
      .update({ application_status: newStatus })
      .eq("application_id", application_id)
      .eq("application_status", "pending_dorm_manager");

    if (error) throw new Error(error.message);

    // Fetch accommodation name for log
    const { data: appData } = await supabase
      .from("accommodation_application")
      .select(`
        preferred_accommodation_id,
        accommodation: preferred_accommodation_id(name)
      `)
      .eq("application_id", application_id)
      .single();

    const accommodationName = (appData as any)?.accommodation?.name ?? "Unknown";
    const actionType = action === "forward" ? "screen_application" : "reject_application";
    const actionLabel = action === "forward" ? "forwarded" : "rejected";
    const userRole = isUserRole(profile.role) ? profile.role : "guest";

    await createActivityLogServer({
      p_user_id: user.id,
      p_action_type: actionType,
      p_log_desc: `${profile.first_name} ${profile.last_name} ${actionLabel} application in ${accommodationName}`,
      p_entity_type: "application",
      p_entity_id: application_id,
      p_user_role: userRole,
    });

    return NextResponse.json({ success: true, new_status: newStatus });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update application." },
      { status: 500 }
    );
  }
}
