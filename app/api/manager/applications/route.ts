import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(_req: NextRequest) {
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

    // Get the accommodation assigned to this manager
    const { data: accommodationData, error: managerError } = await supabase
      .from("accommodation")
      .select("accommodation_id, name")
      .eq("manager_id", user.id)
      .single();

     
    if (managerError) {
      console.error("REAL SUPABASE ERROR:", managerError);
    }

    if (managerError || !accommodationData) {
      return NextResponse.json(
        { error: "No accommodation assignment found for this manager." },
        { status: 404 },
      );
    }

    const accommodation = accommodationData?.accommodation_id;
    console.log(`accom id : ${accommodation}`);

    // Fetch all applications for this accommodation that are pending dorm manager review
    const { data: applications, error: appError } = await supabase
      .from("accommodation_application")
      .select(
        `
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
      `,
      )
      .eq("preferred_accommodation_id", accommodation)
      .eq("application_status", "pending_dorm_manager")
      .order("date_submitted", { ascending: false });

    if (appError) throw new Error(appError.message);

    const { data: units, error: unitsError } = await supabase
      .from("unit") 
      .select("unit_id, unit_number") //
      .eq("accommodation_id", accommodation);

    if (unitsError) throw new Error(unitsError.message);
      console.log(applications)
    return NextResponse.json({
      accommodation: accommodationData,
      applications: applications ?? [],
      units: units ?? [],
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch applications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    return NextResponse.json({ success: true, new_status: newStatus });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to update application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
