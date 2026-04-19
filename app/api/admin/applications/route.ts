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

    // Verify admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "housing_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all applications that have passed dorm manager review
    const { data: applications, error: appError } = await supabase
      .from("accommodation_application")
      .select(`
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

    // Verify admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
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
      return NextResponse.json(
        { error: "Missing application_id or action." },
        { status: 400 }
      );
    }

    if (action === "approve" && !unit_id) {
      return NextResponse.json(
        { error: "A unit must be selected before approving." },
        { status: 400 }
      );
    }

    if (action === "reject") {
      // Simply reject — no assignment created
      const { error } = await supabase
        .from("accommodation_application")
        .update({ application_status: "rejected" })
        .eq("application_id", application_id)
        .eq("application_status", "pending_admin");

      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, new_status: "rejected" });
    }

    // ── Approve flow ───────────────────────────────────────────────────────────

    // 1. Fetch the application to get user_id, check_in, check_out
    const { data: application, error: fetchError } = await supabase
      .from("accommodation_application")
      .select("application_id, user_id, check_in, check_out")
      .eq("application_id", application_id)
      .eq("application_status", "pending_admin")
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found or already processed." },
        { status: 404 }
      );
    }

    // 2. Verify the selected unit still has available space
    const { data: unit, error: unitError } = await supabase
      .from("unit")
      .select("unit_id, max_occupancy, current_occupancy, unit_status")
      .eq("unit_id", unit_id!)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }

    if (unit.current_occupancy >= unit.max_occupancy) {
      return NextResponse.json(
        { error: "Selected unit is already at full capacity." },
        { status: 409 }
      );
    }

    if (unit.unit_status !== "active") {
      return NextResponse.json(
        { error: "Selected unit is not active." },
        { status: 409 }
      );
    }

    // 3. Update application status to approved
    const { error: approveError } = await supabase
      .from("accommodation_application")
      .update({ application_status: "approved" })
      .eq("application_id", application_id);

    if (approveError) throw new Error(approveError.message);

    // 4. Create accommodation_assignment row
    const { error: assignError } = await supabase
      .from("accommodation_assignment")
      .insert({
        application_id: application.application_id,
        unit_id: unit_id!,
        user_id: application.user_id,
        move_in_date: application.check_in,
        expected_move_out_date: application.check_out,
        actual_move_out_date: null,
        assignment_status: "waiting_payment",
      });

    if (assignError) throw new Error(assignError.message);

    return NextResponse.json({
      success: true,
      new_status: "approved",
      assignment_status: "waiting_payment",
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to process application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}