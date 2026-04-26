import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLog, getCurrentUserRole } from "@/services/activity_log/server";

export const GET = withRole(['dormitory_manager', 'housing_admin'], async (_req, { user }) => {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the accommodation assigned to this manager via dormitory_manager table
    const { data: managerAssignment, error: managerError } = await supabase
      .from("dormitory_manager")
      .select(`
        accommodation_id,
        accommodation (
          accommodation_id,
          name
        )
      `)
      .eq("user_id", user.user_id)
      .single();

    const accommodationData = (managerAssignment as any)?.accommodation;

    if (managerError) {
      console.error("DEBUG: managerError:", managerError);
    }

    if (managerError || !accommodationData) {
      return NextResponse.json(
        { error: "No accommodation assignment found for this manager." },
        { status: 404 },
      );
    }

    const accommodationId = accommodationData.accommodation_id;

    // Parallelize applications and units fetching
    const [appsRes, unitsRes] = await Promise.all([
      supabase
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
          file,
          users (
            first_name,
            last_name,
            email
          )
        `)
        .eq("preferred_accommodation_id", accommodationId)
        .order("date_submitted", { ascending: false }),
      supabase
        .from("unit")
        .select("unit_id, unit_number, unit_type")
        .eq("accommodation_id", accommodationId)
    ]);

    if (appsRes.error) throw new Error(appsRes.error.message);
    if (unitsRes.error) throw new Error(unitsRes.error.message);

    return NextResponse.json({
      accommodation: accommodationData,
      applications: (appsRes.data ?? []).map((app: any) => ({
        ...app,
        users: Array.isArray(app.users) ? app.users[0] : app.users
      })),
      units: unitsRes.data ?? [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch applications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const PATCH = withRole(['dormitory_manager', 'housing_admin'], async (req: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (
      !profile ||
      !["dormitory_manager", "housing_admin"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { application_id, action, unit_id } = body as {
      application_id: string;
      action: "forward" | "reject";
      unit_id?: string;
    };

    if (!application_id || !action) {
      return NextResponse.json(
        { error: "Missing application_id or action." },
        { status: 400 },
      );
    }

    if (!["forward", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'forward' or 'reject'." },
        { status: 400 },
      );
    }

    if (action === "forward" && !unit_id) {
      return NextResponse.json(
        { error: "A unit_id is required to forward the application." },
        { status: 400 },
      );
    }

    // Map manager action to the correct enum status
    const newStatus = action === "forward" ? "pending_admin" : "rejected";

    const updateData: any = { application_status: newStatus };

    if (action === "forward" && unit_id) {
      updateData.unit_id = unit_id;
    }
    const { error } = await supabase
      .from("accommodation_application")
      .update(updateData)
      .eq("application_id", application_id)
      .eq("application_status", "pending_dorm_manager"); // safety: only update if still at manager stage

    if (error) throw new Error(error.message);

    // Log the action
    const actor = await getCurrentUserRole();
    if (actor) {
      const { data: appData } = await supabase
        .from("accommodation_application")
        .select("user_id, users(first_name, last_name)")
        .eq("application_id", application_id)
        .single();

      const applicantName = appData?.users
        ? `${(appData.users as any).first_name} ${(appData.users as any).last_name}`
        : "Unknown Applicant";

      await createActivityLog({
        p_user_id: actor.userId,
        p_action_type: action === "forward" ? "screen_application" : "reject_application",
        p_log_desc: `${actor.first_name} ${action === "forward" ? "screened" : "rejected"} application for ${applicantName}`,
        p_entity_type: "application",
        p_entity_id: application_id,
        p_user_role: actor.role,
      });
    }

    return NextResponse.json({ success: true, new_status: newStatus });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to update application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
