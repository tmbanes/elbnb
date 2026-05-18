import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { createActivityLog, getCurrentUserRole } from "@/services/activity_log/server";
import { User } from "@/types/user.types";

export type ManualInvoiceItem = {
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

export async function getSingleApplicationService(user: User, id: string) {
  const supabase = await createSupabaseServerClient();

  if (user.role === 'student') {
    throw new Error("Students cannot fetch single applications this way yet.");
  }

  const { data, error } = await supabaseAdmin
    .from("accommodation_application")
    .select(`
      *,
      users:user_id (
        first_name, last_name, email,
        student:student ( student_num )
      ),
      accommodation:preferred_accommodation_id (accommodation_id, name, location),
      unit:unit_id (unit_number)
    `)
    .eq("application_id", id)
    .single();

  if (error) throw new Error(error.message);

  // Manager check
  if (user.role === 'dormitory_manager') {
    const { data: managerData } = await supabase
      .from("accommodation")
      .select("accommodation_id")
      .eq("manager_id", user.user_id)
      .single();

    if (!managerData || managerData.accommodation_id !== data.preferred_accommodation_id) {
      throw new Error("Unauthorized to view this application.");
    }
  }

  const { data: unitList } = await supabase
    .from("unit")
    .select("unit_id, unit_number, unit_type, rental_fee")
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
    const { data: allBillings } = await supabaseAdmin
      .from("billing")
      .select(`
        billing_id, amount, due_date, billing_period_date, status,
        internal_notes, assignment_id, created_at,
        billing_item ( type, amount )
      `);

    const latestBilling = (allBillings ?? [])
      .filter((b: any) => String(b.assignment_id) === String(assignment.assignment_id))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    invoiceDraft = latestBilling ?? null;
  }

  return {
    ...data,
    availableUnits: unitList || [],
    assignment: assignment ?? null,
    invoiceDraft,
  };
}

export async function getApplicationsService(user: User) {
  const supabase = await createSupabaseServerClient();

  if (user.role === 'student') {
    // Actually the student route uses CreateApplicationService.getApplicationsByUser.
    // We can call it from the route directly. 
    return [];
  }

  if (user.role === 'dormitory_manager' || user.role === 'housing_admin' || user.role === 'admin') {
    if (user.role === 'dormitory_manager') {
      const { data: accommodationData, error: managerError } = await supabase
        .from("accommodation")
        .select("accommodation_id, name")
        .eq("manager_id", user.user_id)
        .single();

      if (managerError || !accommodationData) {
        throw new Error("No accommodation assignment found for this manager.");
      }

      const accommodationId = accommodationData.accommodation_id;

      const [appsRes, unitsRes] = await Promise.all([
        supabase
          .from("accommodation_application")
          .select(`
            application_id, preferred_accommodation_id, preferred_unit_type,
            date_submitted, duration_of_stay, check_in, check_out,
            number_of_companions, application_status, user_id, file,
            users ( 
              first_name, last_name, email,
              student:student ( student_num )
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

      return {
        accommodation: accommodationData,
        applications: (appsRes.data ?? []).map((app: any) => {
          const user = Array.isArray(app.users) ? app.users[0] : app.users;
          if (user && user.student && Array.isArray(user.student)) {
            user.student = user.student[0];
          }
          return {
            ...app,
            users: user
          };
        }),
        units: unitsRes.data ?? [],
      };
    } else {
      // Admin
      const { data: applications, error: appError } = await supabase
        .from("accommodation_application")
        .select(`
          application_id, preferred_accommodation_id, preferred_unit_type,
          date_submitted, duration_of_stay, check_in, check_out,
          number_of_companions, application_status, user_id,
          users ( 
            first_name, last_name, email,
            student:student ( student_num )
          ),
          accommodation:preferred_accommodation_id (
            accommodation_id, name, location,
            unit ( unit_id, unit_number, unit_type, max_occupancy, current_occupancy, rental_fee, billing_period, unit_status )
          )
        `)
        .eq("application_status", "pending_admin")
        .order("date_submitted", { ascending: false });

      if (appError) throw new Error(appError.message);

      return {
        applications: (applications ?? []).map((app: any) => {
          const user = Array.isArray(app.users) ? app.users[0] : app.users;
          if (user && user.student && Array.isArray(user.student)) {
            user.student = user.student[0];
          }
          return {
            ...app,
            users: user
          };
        })
      };
    }
  }

  throw new Error("Unauthorized role");
}

export async function getAdminApplicationsService(user: User, filters: {
  id?: string | null;
  status?: string;
  accommodation?: string;
  period?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { id, status = "all", accommodation = "all", period = "all" } = filters;

  // 1. Fetch the accommodations this specific admin manages
  let managedAccommodationIds: string[] = [];
  let authorizedAccommodations: any[] = [];

  const { data: adminData } = await supabase
    .from("housing_admin")
    .select("accommodation_ids")
    .eq("user_id", user.user_id)
    .maybeSingle();

  if (user.role === 'admin') {
    // Super admins see everything
    const { data: allAccoms } = await supabase.from("accommodation").select("accommodation_id, name, accommodation_type");
    authorizedAccommodations = allAccoms || [];
    managedAccommodationIds = authorizedAccommodations.map(a => a.accommodation_id);
  } else if (adminData?.accommodation_ids && adminData.accommodation_ids.length > 0) {
    // Housing admins are restricted to their assigned IDs
    managedAccommodationIds = adminData.accommodation_ids;
    const { data: accoms } = await supabase
      .from("accommodation")
      .select("accommodation_id, name, accommodation_type")
      .in("accommodation_id", managedAccommodationIds);
    authorizedAccommodations = accoms || [];
  }

  // --- CASE A: Fetch just ONE single application ---
  if (id) {
    const { data, error } = await supabaseAdmin
      .from("accommodation_application")
      .select(`
        *,
        users:user_id (first_name, last_name, email),
        accommodation:preferred_accommodation_id (accommodation_id, name, location),
        unit:unit_id (unit_number)
      `)
      .eq("application_id", id)
      .single();

    if (error) throw new Error(error.message);

    // SECURITY GUARD: Ensure this specific application belongs to an accommodation this admin manages
    if (!managedAccommodationIds.includes(data.preferred_accommodation_id)) {
      throw new Error("Forbidden: You do not manage this accommodation.");
    }

    // Fetch available units for the dropdown logic
    const { data: unitList } = await supabase
      .from("unit")
      .select("unit_id, unit_number, unit_type, rental_fee")
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
      const { data: allBillings } = await supabaseAdmin
        .from("billing")
        .select(`
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
        `);

      const latestBilling = (allBillings ?? [])
        .filter((b: any) => String(b.assignment_id) === String(assignment.assignment_id))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      invoiceDraft = latestBilling ?? null;
    }

    // Format response exactly how frontend needs it
    const userObj = Array.isArray(data.users) ? data.users[0] : data.users;
    return {
      ...data,
      users: userObj,
      accommodation: Array.isArray(data.accommodation) ? data.accommodation[0] : data.accommodation,
      unit: Array.isArray(data.unit) ? data.unit[0] : data.unit,
      availableUnits: unitList || [],
      assignment: assignment ?? null,
      invoiceDraft,
      accommodations: authorizedAccommodations,
    };
  }

  // --- CASE B: Fetch ALL applications handled by this admin ---
  if (managedAccommodationIds.length === 0) {
    return { applications: [], accommodations: [] };
  }

  let query = supabase
    .from("accommodation_application")
    .select(`
      application_id,
      application_status,
      date_submitted,
      user_id,
      unit_id,
      preferred_unit_type,
      preferred_accommodation_id,
      users (
        user_id,
        first_name,
        last_name,
        student:student (
          student_num
        )
      ),
      accommodation:preferred_accommodation_id (
        name
      ),
      unit:unit_id (
        unit_id
      )
    `);

  // Scope down based on the accommodation filter
  if (accommodation !== "all") {
    if (managedAccommodationIds.includes(accommodation)) {
      query = query.eq("preferred_accommodation_id", accommodation);
    } else {
      throw new Error("Forbidden: You do not manage this accommodation.");
    }
  } else {
    query = query.in("preferred_accommodation_id", managedAccommodationIds);
  }

  // Status Filter
  if (status !== "all") {
    query = query.eq("application_status", status);
  }

  // Period Filter
  if (period !== "all") {
    const now = new Date();
    if (period === "semestral") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      query = query.gte("date_submitted", sixMonthsAgo.toISOString());
    } else if (period === "annual") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      query = query.gte("date_submitted", oneYearAgo.toISOString());
    }
  }

  const { data: applications, error: appError } = await query.order("date_submitted", { ascending: false });

  if (appError) throw new Error(appError.message);

  // Map/Flatten the list dataset cleanly on the server-side
  const mappedApplications = (applications as any[])?.map((app) => {
    const userObj = Array.isArray(app.users) ? app.users[0] : app.users;
    if (userObj && userObj.student && Array.isArray(userObj.student)) {
      userObj.student = userObj.student[0];
    }
    return {
      ...app,
      users: userObj,
      accommodation: Array.isArray(app.accommodation) ? app.accommodation[0] : app.accommodation,
      unit: Array.isArray(app.unit) ? app.unit[0] : app.unit,
    };
  });

  return {
    applications: mappedApplications ?? [],
    accommodations: authorizedAccommodations
  };
}

export async function processApplicationService(user: User, payload: any) {
  const supabase = await createSupabaseServerClient();
  const { application_id, action, unit_id } = payload;

  if (!application_id || !action) {
    throw new Error("Missing application_id or action.");
  }

  if (user.role === 'dormitory_manager') {
    if (!["forward", "reject"].includes(action)) {
      throw new Error("Invalid action. Must be 'forward' or 'reject'.");
    }
    if (action === "forward" && !unit_id) {
      throw new Error("A unit_id is required to forward the application.");
    }

    const newStatus = action === "forward" ? "pending_admin" : "rejected";
    const updateData: any = { application_status: newStatus };
    if (action === "forward" && unit_id) updateData.unit_id = unit_id;

    const { error } = await supabase
      .from("accommodation_application")
      .update(updateData)
      .eq("application_id", application_id)
      .eq("application_status", "pending_dorm_manager");

    if (error) {
      throw new Error(error.message);
    }

    const actor = await getCurrentUserRole();
    if (actor) {
      const { data: appData } = await supabase.from("accommodation_application").select("user_id, users(first_name, last_name)").eq("application_id", application_id).single();
      const applicantName = appData?.users ? `${(appData.users as any).first_name} ${(appData.users as any).last_name}` : "Unknown Applicant";

      await createActivityLog({
        p_user_id: actor.userId,
        p_action_type: action === "forward" ? "screen_application" : "reject_application",
        p_log_desc: `${actor.first_name} ${action === "forward" ? "screened" : "rejected"} application for ${applicantName}`,
        p_entity_type: "application",
        p_entity_id: application_id,
        p_user_role: actor.role,
      });
    }

    return { success: true, new_status: newStatus };
  }

  if (user.role === 'admin' || user.role === 'housing_admin') {
    if (action === "approve" && !unit_id) {
      throw new Error("A unit must be selected before approving.");
    }

    if (action === "reject") {
      const { data, error } = await supabase
        .from("accommodation_application")
        .update({ application_status: "rejected" })
        .eq("application_id", application_id)
        .in("application_status", ["pending_dorm_manager", "pending_admin", "pending_payment", "waitlisted"])
        .select();

      if (error) {
        throw new Error(error.message);
      }
      if (!data || data.length === 0) throw new Error("Application could not be rejected.");

      const actor = await getCurrentUserRole();
      if (actor) {
        const { data: appData } = await supabase.from("accommodation_application").select("user_id, users(first_name, last_name)").eq("application_id", application_id).single();
        const applicantName = appData?.users ? `${(appData.users as any).first_name} ${(appData.users as any).last_name}` : "Unknown Applicant";
        await createActivityLog({ p_user_id: actor.userId, p_action_type: "reject_application", p_log_desc: `${actor.first_name} rejected application for ${applicantName}`, p_entity_type: "application", p_entity_id: application_id, p_user_role: actor.role });
      }
      return { success: true, new_status: "rejected" };
    }

    if (action === "pending_payment") {
      const { data: application, error: appError } = await supabase.from("accommodation_application").select("application_id, application_status, user_id, check_in, check_out").eq("application_id", application_id).single();
      if (appError || !application) throw new Error("Application not found.");

      // Stage 1: Approve & Assign (move from pending_admin to pending_payment)
      if (application.application_status === "pending_admin") {
        if (!unit_id) throw new Error("A unit must be selected to approve and assign.");

        const { data: unit, error: unitError } = await supabase.from("unit").select("unit_id, max_occupancy, current_occupancy, unit_status, rental_fee").eq("unit_id", unit_id!).single();
        if (unitError || !unit) throw new Error("Unit not found.");
        if (unit.current_occupancy >= unit.max_occupancy) throw new Error("Selected unit is already at full capacity.");
        if (unit.unit_status !== "active") throw new Error("Selected unit is not active.");

        await supabaseAdmin.from("accommodation_application").update({ application_status: "pending_payment", unit_id: unit_id! }).eq("application_id", application_id);

        const { data: existingAssignment } = await supabaseAdmin.from("accommodation_assignment").select("assignment_id").eq("application_id", application_id).maybeSingle();
        let assignmentId: string;

        if (existingAssignment?.assignment_id) {
          assignmentId = existingAssignment.assignment_id;
          await supabaseAdmin.from("accommodation_assignment").update({ unit_id: unit_id! }).eq("assignment_id", assignmentId);
        } else {
          const { data: assignment, error: assignError } = await supabaseAdmin.from("accommodation_assignment").insert({
            application_id: application.application_id, unit_id: unit_id!, user_id: application.user_id, move_in_date: application.check_in, expected_move_out_date: application.check_out, actual_move_out_date: null, assignment_status: "waiting_payment"
          }).select("assignment_id").single();
          if (assignError) throw new Error(`Failed to create assignment: ${assignError.message}`);
          assignmentId = assignment.assignment_id;
        }

        const actor = await getCurrentUserRole();
        if (actor) {
          const { data: appData } = await supabase.from("accommodation_application").select("user_id, users(first_name, last_name)").eq("application_id", application_id).single();
          const applicantName = appData?.users ? `${(appData.users as any).first_name} ${(appData.users as any).last_name}` : "Unknown Applicant";
          await createActivityLog({ p_user_id: actor.userId, p_action_type: "approve_application", p_log_desc: `${actor.first_name} approved application for ${applicantName} (Awaiting Payment)`, p_entity_type: "application", p_entity_id: application_id, p_user_role: actor.role });
        }

        return { success: true, new_status: "pending_payment", assignment_status: "waiting_payment" };
      }

      // Stage 2: Final Approval (move from pending_payment to approved)
      if (application.application_status === "pending_payment") {
        const { data: applicationData } = await supabaseAdmin.from("accommodation_application").select("user_id").eq("application_id", application_id).single();
        if (!applicationData) throw new Error("Application not found.");

        const { data: userAssignments } = await supabaseAdmin.from("accommodation_assignment").select("assignment_id, assignment_status, application_id").eq("user_id", applicationData.user_id);
        const assignment = (userAssignments ?? []).find((a: any) => String(a.application_id) === String(application_id));
        if (!assignment) throw new Error("No assignment found for this application.");

        const { data: latestBilling, error: billingError } = await supabase.from("billing").select("billing_id, status").eq("assignment_id", assignment.assignment_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (billingError || !latestBilling?.billing_id) throw new Error("No invoice found for this application.");
        if (latestBilling.status !== "paid") throw new Error("Invoice must be marked as paid before final approval.");

        await supabaseAdmin.from("accommodation_assignment").update({ assignment_status: "active" }).eq("assignment_id", assignment.assignment_id);
        await supabaseAdmin.from("accommodation_application").update({ application_status: "approved" }).eq("application_id", application_id);

        const actor = await getCurrentUserRole();
        if (actor) {
          const { data: appData } = await supabaseAdmin.from("accommodation_application").select("user_id, users:user_id(first_name, last_name)").eq("application_id", application_id).single();
          const applicantName = (appData as any)?.users ? `${(appData as any).users.first_name} ${(appData as any).users.last_name}` : "Unknown Applicant";
          await createActivityLog({ p_user_id: actor.userId, p_action_type: "approve_application", p_log_desc: `${actor.first_name} approved application for ${applicantName} (Final Approval)`, p_entity_type: "application", p_entity_id: application_id, p_user_role: actor.role });
          await createActivityLog({ p_user_id: actor.userId, p_action_type: "update_assignment", p_log_desc: `${actor.first_name} activated housing assignment for ${applicantName}`, p_entity_type: "assignment", p_entity_id: assignment.assignment_id, p_user_role: actor.role });
        }

        return { success: true, new_status: "approved", assignment_status: "active" };
      }

      throw new Error(`Action 'pending_payment' is not valid for application status: ${application.application_status}`);
    }

    if (action === "approve") {
      const { data: application, error: fetchError } = await supabase
        .from("accommodation_application")
        .select("application_id, user_id, check_in, check_out, application_status")
        .eq("application_id", application_id)
        .in("application_status", ["pending_admin", "pending_payment"])
        .single();

      if (fetchError || !application) throw new Error("Application not found or not in an approvable state.");

      const { data: unit, error: unitError } = await supabase.from("unit").select("unit_id, max_occupancy, current_occupancy, unit_status, rental_fee").eq("unit_id", unit_id!).single();
      if (unitError || !unit) throw new Error("Unit not found.");
      if (unit.current_occupancy >= unit.max_occupancy) throw new Error("Selected unit is already at full capacity.");
      if (unit.unit_status !== "active") throw new Error("Selected unit is not active.");

      await supabaseAdmin.from("accommodation_application")
        .update({ application_status: "pending_payment", unit_id: unit_id! })
        .eq("application_id", application_id);

      const { data: existingAssignment } = await supabaseAdmin
        .from("accommodation_assignment")
        .select("assignment_id")
        .eq("application_id", application_id)
        .maybeSingle();

      let assignmentId: string;

      if (existingAssignment?.assignment_id) {
        assignmentId = existingAssignment.assignment_id;
        await supabaseAdmin.from("accommodation_assignment")
          .update({ unit_id: unit_id! })
          .eq("assignment_id", assignmentId);
      } else {
        const { data: assignment, error: assignError } = await supabaseAdmin.from("accommodation_assignment").insert({
          application_id: application.application_id, unit_id: unit_id!, user_id: application.user_id,
          move_in_date: application.check_in, expected_move_out_date: application.check_out,
          actual_move_out_date: null, assignment_status: "waiting_payment"
        }).select("assignment_id").single();

        if (assignError) {
          await supabaseAdmin.from("accommodation_application").update({ application_status: "pending_admin", unit_id: null }).eq("application_id", application.application_id);
          throw new Error(`Failed to create assignment: ${assignError.message}`);
        }
        assignmentId = assignment.assignment_id;
      }

      const actor = await getCurrentUserRole();
      if (actor) {
        const { data: appData } = await supabase.from("accommodation_application").select("user_id, users(first_name, last_name)").eq("application_id", application_id).single();
        const applicantName = appData?.users ? `${(appData.users as any).first_name} ${(appData.users as any).last_name}` : "Unknown Applicant";
        await createActivityLog({ p_user_id: actor.userId, p_action_type: "approve_application", p_log_desc: `${actor.first_name} approved application for ${applicantName} (Awaiting Payment)`, p_entity_type: "application", p_entity_id: application_id, p_user_role: actor.role });
        await createActivityLog({ p_user_id: actor.userId, p_action_type: "create_assignment", p_log_desc: `${actor.first_name} created/updated accommodation assignment for ${applicantName}`, p_entity_type: "assignment", p_entity_id: assignmentId, p_user_role: actor.role });
      }

      return { success: true, new_status: "pending_payment", assignment_status: "waiting_payment", message: "Application approved." };
    }
  }

  throw new Error("Unauthorized or unknown action");
}


export async function createInvoiceService(user: User, payload: any) {
  if (user.role !== 'admin' && user.role !== 'housing_admin') {
    throw new Error("Only admins can create invoices.");
  }

  const supabase = await createSupabaseServerClient();
  const { application_id, due_date, items, note, unit_id } = payload;

  if (!application_id || !due_date || !Array.isArray(items) || items.length === 0) {
    throw new Error("application_id, due_date and at least one invoice item are required.");
  }

  const normalizedItems = items.map((item: any) => ({
    kind: item.kind, amount: Number(item.amount ?? 0), required_to_secure_slot: Boolean(item.required_to_secure_slot), note: item.note ?? "",
  })).filter((item: any) => Number.isFinite(item.amount) && item.amount > 0);

  if (normalizedItems.length === 0) throw new Error("All invoice item amounts must be greater than 0.");

  const requiredItems = normalizedItems.filter((item: any) => item.required_to_secure_slot);
  if (requiredItems.length === 0) throw new Error("At least one item must be marked as required to secure the slot.");

  const dueDate = new Date(due_date);
  if (Number.isNaN(dueDate.getTime())) throw new Error("Invalid due_date.");

  const { data: application, error: appError } = await supabase.from("accommodation_application").select("application_id, user_id, unit_id, check_in, check_out, application_status").eq("application_id", application_id).single();
  if (appError || !application) throw new Error("Application not found.");
  if (!["pending_payment", "approved"].includes(application.application_status)) throw new Error("Invoice can only be sent for pending payment/approved applications.");

  let assignmentId: string | null = null;
  let resolvedUnitId = unit_id ?? application.unit_id ?? null;
  const { data: existingAssignment } = await supabase.from("accommodation_assignment").select("assignment_id").eq("application_id", application_id).maybeSingle();

  if (existingAssignment?.assignment_id) {
    assignmentId = existingAssignment.assignment_id;
  } else {
    if (!resolvedUnitId) throw new Error("No assigned unit found for this application.");
    const { data: createdAssignment, error: createAssignmentError } = await supabaseAdmin.from("accommodation_assignment").insert({
      application_id: application.application_id, unit_id: resolvedUnitId, user_id: application.user_id, move_in_date: application.check_in, expected_move_out_date: application.check_out, actual_move_out_date: null, assignment_status: "waiting_payment"
    }).select("assignment_id").single();
    if (createAssignmentError || !createdAssignment?.assignment_id) throw new Error(createAssignmentError?.message ?? "Failed to create assignment.");
    assignmentId = createdAssignment.assignment_id;
  }

  const periodDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
  const totalAmount = normalizedItems.reduce((sum: number, item: any) => sum + item.amount, 0);

  // Delete any previous unpaid/draft billing rows for this assignment before creating a fresh invoice.
  // This makes "Send Invoice" an effective upsert and prevents duplicate rows that break .maybeSingle() queries.
  await supabaseAdmin
    .from('billing')
    .delete()
    .eq('assignment_id', assignmentId)
    .in('status', ['unpaid', 'draft', 'overdue', 'failed']);

  // Create new invoice
  const { data: createdBilling, error: createBillingError } = await supabaseAdmin.from("billing").insert({
    assignment_id: assignmentId,
    amount: totalAmount,
    billing_period_date: periodDate.toISOString(),
    due_date: dueDate.toISOString(),
    status: "unpaid",
    payment_method: "cash",
    internal_notes: note || "",
  }).select("billing_id").single();

  if (createBillingError || !createdBilling?.billing_id) throw new Error(createBillingError?.message ?? "Failed to create invoice.");

  const { error: insertItemsError } = await supabaseAdmin.from("billing_item").insert(
    normalizedItems.map((item: any) => ({
      billing_id: createdBilling.billing_id,
      type: mapInvoiceKindToBillingType(item.kind),
      amount: item.amount,
    }))
  );

  if (insertItemsError) {
    await supabaseAdmin.from("billing").delete().eq("billing_id", createdBilling.billing_id);
    throw new Error(insertItemsError.message);
  }

  const actor = await getCurrentUserRole();
  if (actor) {
    const { data: appData } = await supabase.from("accommodation_application").select("user_id, users(first_name, last_name)").eq("application_id", application_id).single();
    const applicantName = appData?.users ? `${(appData.users as any).first_name} ${(appData.users as any).last_name}` : "Unknown Applicant";
    await createActivityLog({ p_user_id: actor.userId, p_action_type: "generate_billing", p_log_desc: `${actor.first_name} generated invoice for ${applicantName}`, p_entity_type: "billing", p_entity_id: createdBilling.billing_id, p_user_role: actor.role });
  }

  return { success: true, billing_id: createdBilling.billing_id };
}
