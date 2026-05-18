// /api/admin/applications
import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth/api-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createActivityLog, getCurrentUserRole } from "@/services/activity_log/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { User } from "@/types/user.types";
import { getAdminApplicationsService } from "@/services/application_workflow/applications";


type ManualInvoiceItem = {
  kind: "first_rental" | "security_deposit" | "reservation_fee" | "other" | "room_rent";
  amount: number;
  required_to_secure_slot?: boolean;
  note?: string;
};

function mapInvoiceKindToBillingType(kind: ManualInvoiceItem["kind"]) {
  if (kind === "security_deposit") return "security_deposit";
  if (kind === "reservation_fee") return "reservation_fee";
  if (kind === "first_rental" || kind === "room_rent") return "room_rent";
  return "other";
}

export const GET = withRole(["housing_admin", "admin"], async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status") || "all";
    const accommodation = searchParams.get("accommodation") || "all";
    const period = searchParams.get("period") || "all";

    const data = await getAdminApplicationsService(user, { id, status, accommodation, period });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch applications.";
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
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
      const { data, error } = await supabase
        .from("accommodation_application")
        .update({ application_status: "rejected" })
        .eq("application_id", application_id)
        .in("application_status", ["pending_dorm_manager", "pending_admin", "pending_payment", "waitlisted"])
        .select();

      if (error) throw new Error(error.message);

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: "Application could not be rejected. It may have already been processed or is in a final state." },
          { status: 400 }
        );
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

    const internalNotes = note || "";

    // Check for existing unpaid invoice
    const { data: existingBilling } = await supabaseAdmin
      .from('billing')
      .select('billing_id')
      .eq('assignment_id', assignmentId)
      .in('status', ['unpaid', 'draft'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingBilling?.billing_id) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from('billing')
        .update({
          amount: totalAmount,
          due_date: dueDate.toISOString(),
          billing_period_date: periodDate.toISOString(),
          internal_notes: internalNotes,
        })
        .eq('billing_id', existingBilling.billing_id);

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

      // Replace items
      await supabaseAdmin.from('billing_item').delete().eq('billing_id', existingBilling.billing_id);
      await supabaseAdmin.from('billing_item').insert(
        normalizedItems.map((item) => ({
          billing_id: existingBilling.billing_id,
          type: mapInvoiceKindToBillingType(item.kind),
          amount: item.amount,
        }))
      );

      return NextResponse.json({
        success: true,
        billing_id: existingBilling.billing_id,
        mode: "updated",
        required_to_secure_slot_total: requiredAmount,
      });
    }

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
