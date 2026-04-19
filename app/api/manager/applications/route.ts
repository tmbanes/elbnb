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
    const { data: managerData, error: managerError } = await supabase
      .from("dormitory_manager")
      .select("accommodation ( accommodation_id, name )")
      .eq("user_id", user.id)
      .single();

    if (managerError || !managerData) {
      return NextResponse.json(
        { error: "No accommodation assigned to this manager." },
        { status: 404 }
      );
    }

    const accommodation = managerData.accommodation as {
      accommodation_id: string;
      name: string;
    } | null;

    if (!accommodation) {
      return NextResponse.json(
        { error: "No accommodation assigned to this manager." },
        { status: 404 }
      );
    }

    // Fetch all applications for this accommodation that are pending dorm manager review
    const { data: applications, error: appError } = await supabase
      .from("accommodation_application")
      .select(
        `
        application_id,
        preferred_accommodation_id,
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
      `
      )
      .eq("preferred_accommodation_id", accommodation.accommodation_id)
      .eq("application_status", "pending_dorm_manager")
      .order("date_submitted", { ascending: false });

    if (appError) throw new Error(appError.message);

    return NextResponse.json({
      accommodation,
      applications: applications ?? [],
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
    const { application_id, action } = body as {
      application_id: string;
      action: "forward" | "reject";
    };

    if (!application_id || !action) {
      return NextResponse.json(
        { error: "Missing application_id or action." },
        { status: 400 }
      );
    }

    if (!["forward", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'forward' or 'reject'." },
        { status: 400 }
      );
    }

    // Map manager action to the correct enum status
    const newStatus =
      action === "forward" ? "pending_admin" : "rejected";

    const { error } = await supabase
      .from("accommodation_application")
      .update({ application_status: newStatus })
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