// app/api/manager/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Use maybeSingle() so a missing row returns null instead of throwing,
    // preventing the route from returning an HTML error page.
    const { data: accommodationData, error: accomError } = await supabase
      .from("accommodation")
      .select("accommodation_id, name")
      .eq("manager_id", user.id)
      .maybeSingle();

    if (accomError) {
      console.error("Accommodation lookup error:", accomError.message);
      return NextResponse.json(
        { error: `Accommodation lookup failed: ${accomError.message}` },
        { status: 500 }
      );
    }

    // Return a valid empty response instead of 404 so the UI never
    // tries to parse an HTML error page as JSON.
    if (!accommodationData) {
      return NextResponse.json({
        accommodation: null,
        applications: [],
        units: [],
      });
    }

    const accommodationId = accommodationData.accommodation_id;

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
      `
      )
      .eq("preferred_accommodation_id", accommodationId)
      .eq("application_status", "pending_dorm_manager")
      .order("date_submitted", { ascending: false });

    if (appError) {
      console.error("Applications fetch error:", appError.message);
      return NextResponse.json(
        { error: `Failed to fetch applications: ${appError.message}` },
        { status: 500 }
      );
    }

    const { data: units, error: unitsError } = await supabase
      .from("unit")
      .select("unit_id, unit_number")
      .eq("accommodation_id", accommodationId);

    if (unitsError) {
      console.error("Units fetch error:", unitsError.message);
      return NextResponse.json(
        { error: `Failed to fetch units: ${unitsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accommodation: accommodationData,
      applications: applications ?? [],
      units: units ?? [],
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch dashboard data.";
    console.error("Dashboard GET unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        { status: 400 }
      );
    }

    if (!["forward", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'forward' or 'reject'." },
        { status: 400 }
      );
    }

    if (action === "forward" && !unit_id) {
      return NextResponse.json(
        { error: "A unit_id is required to forward the application." },
        { status: 400 }
      );
    }

    const newStatus = action === "forward" ? "pending_admin" : "rejected";
    const updateData: Record<string, string> = { application_status: newStatus };

    if (action === "forward" && unit_id) {
      updateData.unit_id = unit_id;
    }

    const { error } = await supabase
      .from("accommodation_application")
      .update(updateData)
      .eq("application_id", application_id)
      .eq("application_status", "pending_dorm_manager");

    if (error) {
      console.error("Application update error:", error.message);
      return NextResponse.json(
        { error: `Failed to update application: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, new_status: newStatus });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to update application.";
    console.error("Dashboard PATCH unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
