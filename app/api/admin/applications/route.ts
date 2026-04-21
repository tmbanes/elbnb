import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get("id");

    // If an ID is provided, fetch just that one application
    if (id) {
      const { data, error } = await supabase
        .from("accommodation_application")
        .select(
          `
        *,
        users:user_id (first_name, last_name, email),
        accommodation:preferred_accommodation_id (accommodation_id, name, location),
        units:unit_id (unit_number)
      `,
        )
        .eq("application_id", id)
        .single();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 404 });

      // Fetch available units for the dropdown logic
      const { data: unitList } = await supabase
        .from("unit")
        .select("unit_id, unit_number, unit_type")
        .eq("accommodation_id", data.preferred_accommodation_id);

      return NextResponse.json({ ...data, availableUnits: unitList || [] });
    }

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
      `,
      )
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
        { status: 400 },
      );
    }

    if (action === "approve" && !unit_id) {
      return NextResponse.json(
        { error: "A unit must be selected before approving." },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // 2. Verify the selected unit still has available space
    const { data: unit, error: unitError } = await supabase
      .from("unit")
      .select("unit_id, max_occupancy, current_occupancy, unit_status, rental_fee")
      .eq("unit_id", unit_id!)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }

    if (unit.current_occupancy >= unit.max_occupancy) {
      return NextResponse.json(
        { error: "Selected unit is already at full capacity." },
        { status: 409 },
      );
    }

    if (unit.unit_status !== "active") {
      return NextResponse.json(
        { error: "Selected unit is not active." },
        { status: 409 },
      );
    }

    const monthlyRent = Number(unit.rental_fee ?? 0);
    if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      return NextResponse.json(
        { error: "Selected unit has no valid rental fee for invoice creation." },
        { status: 400 },
      );
    }

    // 3. Update application status to pending payment and persist selected unit
    const { error: approveError } = await supabaseAdmin
      .from("accommodation_application")
      .update({ application_status: "pending_payment", unit_id: unit_id! })
      .eq("application_id", application_id);

    if (approveError) throw new Error(approveError.message);

    // 4. Create accommodation_assignment row
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from("accommodation_assignment")
      .insert({
        application_id: application.application_id,
        unit_id: unit_id!,
        user_id: application.user_id,
        move_in_date: application.check_in,
        expected_move_out_date: application.check_out,
        actual_move_out_date: null,
        assignment_status: "waiting_payment",
      })
      .select("assignment_id")
      .single();

    if (assignError) {
      await supabaseAdmin
        .from("accommodation_application")
        .update({ application_status: "pending_admin", unit_id: null })
        .eq("application_id", application.application_id);
      throw new Error(`Failed to create assignment: ${assignError.message}`);
    }

    // 5. Auto-generate initial invoice (1 month room rent)
    const dueDate = application.check_in ? new Date(application.check_in) : new Date();
    const billingPeriodDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

    const { data: billing, error: billingError } = await supabaseAdmin
      .from("billing")
      .insert({
        assignment_id: assignment.assignment_id,
        amount: monthlyRent,
        billing_period_date: billingPeriodDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: "unpaid",
        payment_method: "cash",
        internal_notes: "Auto-generated initial invoice upon admin approval (1 month room rent).",
      })
      .select("billing_id")
      .single();

    if (billingError) {
      await supabaseAdmin
        .from("accommodation_assignment")
        .delete()
        .eq("assignment_id", assignment.assignment_id);

      await supabaseAdmin
        .from("accommodation_application")
        .update({ application_status: "pending_admin", unit_id: null })
        .eq("application_id", application.application_id);

      throw new Error(`Failed to auto-create invoice: ${billingError.message}`);
    }

    const { error: itemError } = await supabaseAdmin
      .from("billing_item")
      .insert({
        billing_id: billing.billing_id,
        type: "room_rent",
        amount: monthlyRent,
      });

    if (itemError) {
      await supabaseAdmin
        .from("billing")
        .delete()
        .eq("billing_id", billing.billing_id);

      await supabaseAdmin
        .from("accommodation_assignment")
        .delete()
        .eq("assignment_id", assignment.assignment_id);

      await supabaseAdmin
        .from("accommodation_application")
        .update({ application_status: "pending_admin", unit_id: null })
        .eq("application_id", application.application_id);

      throw new Error(`Failed to create billing item: ${itemError.message}`);
    }

    return NextResponse.json({
      success: true,
      new_status: "pending_payment",
      assignment_status: "waiting_payment",
      auto_invoice_amount: monthlyRent,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to process application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
