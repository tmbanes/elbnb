import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth/api-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLog, getCurrentUserRole } from "@/services/activity_log/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

type ManualInvoiceItem = {
  kind: "first_rental" | "security_deposit" | "reservation_fee" | "other" | "room_rent";
  amount: number;
  required_to_secure_slot?: boolean;
  note?: string;
};

function mapInvoiceKindToBillingType(kind: ManualInvoiceItem["kind"]) {
  if (kind === "security_deposit") return "security_deposit";
  if (kind === "reservation_fee") return "reservation_fee";
  return "room_rent";
}

export const GET = withRole(["housing_admin", "admin"], async (req: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
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

      const { data: userAssignments } = await supabaseAdmin
        .from("accommodation_assignment")
        .select("assignment_id, assignment_status, application_id")
        .eq("user_id", data.user_id);

      const assignment = (userAssignments ?? []).find(
        (a: any) => String(a.application_id) === String(id)
      );

      let invoiceDraft: any = null;
      if (assignment?.assignment_id) {
        const { data: allBillings, error: billError } = await supabaseAdmin
          .from("billing")
          .select(
            `
              billing_id,
              amount,
              due_date,
              billing_period_date,
              status,
              internal_notes,
              assignment_id,
              created_at,
              billing_item (
                type,
                amount
              )
            `,
          );

        if (billError) {
          console.error("Billing Query Error:", billError);
        }

        const latestBilling = (allBillings ?? [])
          .filter((b: any) => String(b.assignment_id) === String(assignment.assignment_id))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        invoiceDraft = latestBilling ?? null;
      }

      return NextResponse.json({
        ...data,
        availableUnits: unitList || [],
        assignment: assignment ?? null,
        invoiceDraft,
      });
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
});

export const PATCH = withRole(["housing_admin", "admin"], async (req: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();

    const body = await req.json();
    const { application_id, action, unit_id } = body as {
      application_id: string;
      action: "approve" | "reject" | "pending_payment";
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
          p_action_type: "reject_application",
          p_log_desc: `${actor.first_name} rejected application for ${applicantName}`,
          p_entity_type: "application",
          p_entity_id: application_id,
          p_user_role: actor.role,
        });
      }

      return NextResponse.json({ success: true, new_status: "rejected" });
    }

    if (action === "pending_payment") {
      const { data: application, error: appError } = await supabase
        .from("accommodation_application")
        .select("application_id, application_status")
        .eq("application_id", application_id)
        .single();

      if (appError || !application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
      }

      if (application.application_status !== "pending_payment") {
        return NextResponse.json(
          { error: "Only pending payment applications can be approved from this action." },
          { status: 409 },
        );
      }

      const { data: applicationData } = await supabaseAdmin
        .from("accommodation_application")
        .select("user_id")
        .eq("application_id", application_id)
        .single();

      if (!applicationData) {
        return NextResponse.json(
          { error: "Application not found." },
          { status: 404 },
        );
      }

      const { data: userAssignments } = await supabaseAdmin
        .from("accommodation_assignment")
        .select("assignment_id, assignment_status, application_id")
        .eq("user_id", applicationData.user_id);

      const assignment = (userAssignments ?? []).find(
        (a: any) => String(a.application_id) === String(application_id)
      );

      if (!assignment) {
        return NextResponse.json(
          { error: "No assignment found for this application." },
          { status: 404 },
        );
      }

      const { data: latestBilling, error: billingError } = await supabase
        .from("billing")
        .select("billing_id, status")
        .eq("assignment_id", assignment.assignment_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (billingError || !latestBilling?.billing_id) {
        return NextResponse.json(
          { error: "No invoice found for this application." },
          { status: 404 },
        );
      }

      if (latestBilling.status !== "paid") {
        return NextResponse.json(
          { error: "Invoice must be marked as paid before final approval." },
          { status: 409 },
        );
      }

      const { error: assignmentUpdateError } = await supabaseAdmin
        .from("accommodation_assignment")
        .update({ assignment_status: "active" })
        .eq("assignment_id", assignment.assignment_id);

      if (assignmentUpdateError) throw new Error(assignmentUpdateError.message);

      const { error: appUpdateError } = await supabaseAdmin
        .from("accommodation_application")
        .update({ application_status: "approved" })
        .eq("application_id", application_id);

      if (appUpdateError) throw new Error(appUpdateError.message);

      const actor = await getCurrentUserRole();
      if (actor) {
        const { data: appData } = await supabaseAdmin
          .from("accommodation_application")
          .select("user_id, users:user_id(first_name, last_name)")
          .eq("application_id", application_id)
          .single();
        
        const applicantName = (appData as any)?.users 
          ? `${(appData as any).users.first_name} ${(appData as any).users.last_name}`
          : "Unknown Applicant";

        await createActivityLog({
          p_user_id: actor.userId,
          p_action_type: "approve_application",
          p_log_desc: `${actor.first_name} approved application for ${applicantName} (Final Approval)`,
          p_entity_type: "application",
          p_entity_id: application_id,
          p_user_role: actor.role,
        });

        await createActivityLog({
          p_user_id: actor.userId,
          p_action_type: "update_assignment",
          p_log_desc: `${actor.first_name} activated housing assignment for ${applicantName}`,
          p_entity_type: "assignment",
          p_entity_id: assignment.assignment_id,
          p_user_role: actor.role,
        });
      }

      return NextResponse.json({
        success: true,
        new_status: "approved",
        assignment_status: "active",
      });
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
        p_action_type: "approve_application",
        p_log_desc: `${actor.first_name} approved application for ${applicantName} (Awaiting Payment)`,
        p_entity_type: "application",
        p_entity_id: application_id,
        p_user_role: actor.role,
      });

      await createActivityLog({
        p_user_id: actor.userId,
        p_action_type: "create_assignment",
        p_log_desc: `${actor.first_name} created accommodation assignment for ${applicantName}`,
        p_entity_type: "assignment",
        p_entity_id: assignment.assignment_id,
        p_user_role: actor.role,
      });
    }

    return NextResponse.json({
      success: true,
      new_status: "pending_payment",
      assignment_status: "waiting_payment",
      message: "Application approved. Create and send invoice manually from Applications.",
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to process application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const POST = withRole(["housing_admin", "admin"], async (req: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();

    const body = await req.json();
    const {
      application_id,
      due_date,
      items,
      note,
      unit_id,
    } = body as {
      application_id: string;
      due_date: string;
      items: ManualInvoiceItem[];
      note?: string;
      unit_id?: string;
    };

    if (!application_id || !due_date || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "application_id, due_date and at least one invoice item are required." },
        { status: 400 },
      );
    }

    const normalizedItems = items
      .map((item) => ({
        kind: item.kind,
        amount: Number(item.amount ?? 0),
        required_to_secure_slot: Boolean(item.required_to_secure_slot),
        note: item.note ?? "",
      }))
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: "All invoice item amounts must be greater than 0." },
        { status: 400 },
      );
    }

    const requiredItems = normalizedItems.filter((item) => item.required_to_secure_slot);
    if (requiredItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "At least one item must be marked as required to secure the slot.",
        },
        { status: 400 },
      );
    }

    const dueDate = new Date(due_date);
    if (Number.isNaN(dueDate.getTime())) {
      return NextResponse.json({ error: "Invalid due_date." }, { status: 400 });
    }

    const { data: application, error: appError } = await supabase
      .from("accommodation_application")
      .select("application_id, user_id, unit_id, check_in, check_out, application_status")
      .eq("application_id", application_id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (!["pending_payment", "approved"].includes(application.application_status)) {
      return NextResponse.json(
        { error: "Invoice can only be sent for pending payment/approved applications." },
        { status: 409 },
      );
    }

    let assignmentId: string | null = null;
    let resolvedUnitId = unit_id ?? application.unit_id ?? null;
    const { data: existingAssignment } = await supabase
      .from("accommodation_assignment")
      .select("assignment_id")
      .eq("application_id", application_id)
      .maybeSingle();

    if (existingAssignment?.assignment_id) {
      assignmentId = existingAssignment.assignment_id;
    } else {
      if (!resolvedUnitId) {
        return NextResponse.json(
          { error: "No assigned unit found for this application." },
          { status: 400 },
        );
      }

      const { data: createdAssignment, error: createAssignmentError } = await supabaseAdmin
        .from("accommodation_assignment")
        .insert({
          application_id: application.application_id,
          unit_id: resolvedUnitId,
          user_id: application.user_id,
          move_in_date: application.check_in,
          expected_move_out_date: application.check_out,
          actual_move_out_date: null,
          assignment_status: "waiting_payment",
        })
        .select("assignment_id")
        .single();

      if (createAssignmentError || !createdAssignment?.assignment_id) {
        return NextResponse.json(
          {
            error: createAssignmentError?.message ?? "Failed to create assignment for invoice.",
          },
          { status: 500 },
        );
      }

      assignmentId = createdAssignment.assignment_id;
    }

    const periodDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
    const requiredAmount = requiredItems.reduce((sum, item) => sum + item.amount, 0);

    const internalNotes = "";

    const { data: createdBilling, error: createBillingError } = await supabaseAdmin
      .from("billing")
      .insert({
        assignment_id: assignmentId,
        amount: totalAmount,
        billing_period_date: periodDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: "unpaid",
        payment_method: "cash",
        internal_notes: internalNotes,
      })
      .select("billing_id")
      .single();

    if (createBillingError || !createdBilling?.billing_id) {
      const maybeCode = (createBillingError as any)?.code;
      const maybeMessage = String((createBillingError as any)?.message ?? "");
      const isUniqueAssignment =
        maybeCode === "23505" && maybeMessage.includes("unique_assignment_billing");

      return NextResponse.json(
        {
          error: isUniqueAssignment
            ? "Cannot create another invoice for this assignment because database constraint unique_assignment_billing is active. Update the DB constraint to allow multiple invoices."
            : (createBillingError?.message ?? "Failed to create invoice."),
        },
        { status: 500 },
      );
    }

    const { error: insertItemsError } = await supabaseAdmin.from("billing_item").insert(
      normalizedItems.map((item) => ({
        billing_id: createdBilling.billing_id,
        type: mapInvoiceKindToBillingType(item.kind),
        amount: item.amount,
      })),
    );

    if (insertItemsError) {
      await supabaseAdmin.from("billing").delete().eq("billing_id", createdBilling.billing_id);
      return NextResponse.json({ error: insertItemsError.message }, { status: 500 });
    }

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
        p_action_type: "generate_billing",
        p_log_desc: `${actor.first_name} generated invoice for ${applicantName}`,
        p_entity_type: "billing",
        p_entity_id: createdBilling.billing_id,
        p_user_role: actor.role,
      });
    }

    return NextResponse.json({
      success: true,
      billing_id: createdBilling.billing_id,
      mode: "created",
      required_to_secure_slot_total: requiredAmount,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send manual invoice.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
