import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { AccomodationHistory } from "@/types/accomodation/accomodationHistory";
import { BillingCreation, BillingInformation } from "@/types/billing";
import { BillingStatus } from "@/types/billing/enums";
import { BillingItemType } from "@/types/billing/enums";

//======================================================//
// TYPES
//======================================================//

type UserRole = "student" | "admin" | "guest";

type BillingItemInput = {
  type: BillingItemType;
  amount: number;
};

//======================================================//
// BILLING BOOTSTRAP (AUTO INITIAL INVOICE)
//======================================================//

export async function ensureInitialInvoicesForUser(user_id: string) {
  const supabase = supabaseAdmin;

  const { data: assignments, error: assignmentError } = await supabase
    .from("accommodation_assignment")
    .select("assignment_id, application_id, unit_id, move_in_date, assignment_status")
    .eq("user_id", user_id)
    .in("assignment_status", ["waiting_payment", "pending", "active"]);

  if (assignmentError) {
    return { data: null, error: assignmentError ?? null };
  }

  const { data: pendingApplications, error: pendingApplicationsError } = await supabase
    .from("accommodation_application")
    .select("application_id, user_id, unit_id, check_in, check_out, application_status, preferred_accommodation_id, preferred_unit_type")
    .eq("user_id", user_id)
    .eq("application_status", "pending_payment");

  if (pendingApplicationsError) {
    return { data: null, error: pendingApplicationsError };
  }

  const assignmentList = [...(assignments ?? [])] as any[];
  const assignmentByApplication = new Map<string, any>();
  assignmentList.forEach((row) => {
    if (row?.application_id) {
      assignmentByApplication.set(row.application_id, row);
    }
  });

  // Ensure there is an assignment row for every pending_payment application.
  // Some old records reached pending_payment before assignment creation logic existed.
  for (const app of pendingApplications ?? []) {
    if (!app?.application_id) continue;
    if (assignmentByApplication.has(app.application_id)) continue;
    let fallbackUnitId = app.unit_id as string | null;

    // Legacy recovery: if pending_payment has no saved unit_id, pick a deterministic fallback
    // from active units in the preferred accommodation/type (lowest rental fee first).
    if (!fallbackUnitId && app.preferred_accommodation_id && app.preferred_unit_type) {
      const { data: candidateUnits } = await supabase
        .from("unit")
        .select("unit_id, rental_fee")
        .eq("accommodation_id", app.preferred_accommodation_id)
        .eq("unit_type", app.preferred_unit_type)
        .eq("unit_status", "active")
        .order("rental_fee", { ascending: true })
        .limit(1);

      if (candidateUnits?.length) {
        fallbackUnitId = candidateUnits[0].unit_id;

        await supabase
          .from("accommodation_application")
          .update({ unit_id: fallbackUnitId })
          .eq("application_id", app.application_id);
      }

      // If preferred type does not exist in this accommodation, choose the cheapest active unit.
      if (!fallbackUnitId) {
        const { data: anyActiveUnits } = await supabase
          .from("unit")
          .select("unit_id, rental_fee")
          .eq("accommodation_id", app.preferred_accommodation_id)
          .eq("unit_status", "active")
          .order("rental_fee", { ascending: true })
          .limit(1);

        if (anyActiveUnits?.length) {
          fallbackUnitId = anyActiveUnits[0].unit_id;

          await supabase
            .from("accommodation_application")
            .update({ unit_id: fallbackUnitId })
            .eq("application_id", app.application_id);
        }
      }
    }

    if (!fallbackUnitId) continue;

    const expectedMoveOut = app.check_out ?? app.check_in;

    const { data: createdAssignment, error: createdAssignmentError } = await supabase
      .from("accommodation_assignment")
      .insert({
        application_id: app.application_id,
        unit_id: fallbackUnitId,
        user_id: app.user_id,
        move_in_date: app.check_in,
        expected_move_out_date: expectedMoveOut,
        actual_move_out_date: null,
        assignment_status: "waiting_payment",
      })
      .select("assignment_id, application_id, unit_id, move_in_date, assignment_status")
      .single();

    if (createdAssignmentError) {
      // If insert failed because assignment already exists, try fetching it.
      const { data: fallbackAssignment } = await supabase
        .from("accommodation_assignment")
        .select("assignment_id, application_id, unit_id, move_in_date, assignment_status")
        .eq("application_id", app.application_id)
        .maybeSingle();

      if (fallbackAssignment) {
        assignmentList.push(fallbackAssignment);
        assignmentByApplication.set(app.application_id, fallbackAssignment);
      }

      continue;
    }

    if (createdAssignment) {
      assignmentList.push(createdAssignment);
      assignmentByApplication.set(app.application_id, createdAssignment);
    }
  }

  if (!assignmentList.length) {
    return { data: [], error: null };
  }

  const assignmentIds = assignmentList
    .map((row) => row.assignment_id)
    .filter(Boolean);

  if (!assignmentIds.length) {
    return { data: [], error: null };
  }

  const { data: existingBills, error: existingBillsError } = await supabase
    .from("billing")
    .select("assignment_id")
    .in("assignment_id", assignmentIds);

  if (existingBillsError) {
    return { data: null, error: existingBillsError };
  }

  const withBills = new Set((existingBills ?? []).map((bill: any) => bill.assignment_id));
  const pendingAppIdSet = new Set((pendingApplications ?? []).map((app: any) => app.application_id));
  const createdBillingIds: string[] = [];

  for (const assignment of assignmentList) {
    if (withBills.has(assignment.assignment_id)) continue;

    const shouldCreateInvoice =
      assignment.assignment_status === "waiting_payment" ||
      (assignment.application_id && pendingAppIdSet.has(assignment.application_id));

    if (!shouldCreateInvoice || !assignment.unit_id) continue;

    const { data: unit } = await supabase
      .from("unit")
      .select("rental_fee")
      .eq("unit_id", assignment.unit_id)
      .single();

    const monthlyRent = Number(unit?.rental_fee ?? 0);
    if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) continue;

    const dueDate = assignment.move_in_date ? new Date(assignment.move_in_date) : new Date();
    const billingPeriodDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

    const { data: createdBilling, error: createBillingError } = await supabase
      .from("billing")
      .insert({
        assignment_id: assignment.assignment_id,
        amount: monthlyRent,
        billing_period_date: billingPeriodDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: BillingStatus.UNPAID,
        payment_method: "cash",
        internal_notes: "Auto-generated initial invoice for pending payment assignment.",
      })
      .select("billing_id")
      .single();

    if (createBillingError || !createdBilling?.billing_id) continue;

    await supabase.from("billing_item").insert({
      billing_id: createdBilling.billing_id,
      type: BillingItemType.ROOM_RENT,
      amount: monthlyRent,
    });

    createdBillingIds.push(createdBilling.billing_id);
  }

  return { data: createdBillingIds, error: null };
}

export async function ensureInitialInvoicesForPendingPaymentApplications() {
  const { data: apps, error } = await supabaseAdmin
    .from("accommodation_application")
    .select("user_id")
    .eq("application_status", "pending_payment");

  if (error) {
    return { data: null, error };
  }

  const userIds = Array.from(new Set((apps ?? []).map((row: any) => row.user_id).filter(Boolean)));
  const created: string[] = [];

  for (const uid of userIds) {
    const result = await ensureInitialInvoicesForUser(uid);
    if (result.error) continue;
    if (Array.isArray(result.data)) {
      created.push(...result.data);
    }
  }

  return { data: created, error: null };
}

//======================================================//
// ACCOMODATION SERVICES
//======================================================//

export async function getAccomodationHistory(user_id: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("accommodation_application")
    .select(`
      application_id,
      date_submitted,
      preferred_accommodation,
      preferred_unit_type,
      duration_of_stay,
      check_in,
      check_out,
      number_of_companions,
      application_status,
      accommodation_assignment ( 
        assignment_id,
        move_in_date,
        expected_move_out_date,
        actual_move_out_date,
        assignment_status
      )
    `)
    .eq("user_id", user_id);

  if (error) return { data: null, error };

  const flattened = data?.map(({ accommodation_assignment, ...app }: any) => ({
    ...app,
    ...(accommodation_assignment ?? {}),
  }));

  return { data: flattened as AccomodationHistory[] | null, error };
}

//======================================================//
// CREATE BILLING WITH DETAILED ITEMS
//======================================================//

export async function createBillingWithItems(
  role: UserRole,
  billingData: BillingCreation,
  items: BillingItemInput[]
) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();
  const periodDate = billingData.billing_period_date
    ? new Date(billingData.billing_period_date)
    : new Date(new Date(billingData.due_date).getFullYear(), new Date(billingData.due_date).getMonth(), 1);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const { data: billing, error } = await supabase
    .from("billing")
    .insert([
      {
        ...billingData,
        billing_period_date: periodDate,
        amount: total,
      },
    ])
    .select()
    .single();

  if (error) return { data: null, error };

  const formattedItems = items.map(item => ({
    billing_id: billing.billing_id,
    type: item.type,
    amount: item.amount,
  }));

  await supabase.from("billing_item").insert(formattedItems);

  return { data: billing, error: null };
}

//======================================================//
// STUDENT DETAILED BILL VIEW
//======================================================//

export async function getStudentBillsDetailed(user_id: string) {
  // Safety net: ensure initial invoice exists for pending-payment assignments
  // even if caller did not trigger bootstrap beforehand.
  await ensureInitialInvoicesForUser(user_id);

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .select(`
      billing_id,
      amount,
      billing_period_date,
      due_date,
      status,
      payment_method,
      transaction_reference,
      receipt_files,
      created_at,
      billing_item (
        type,
        amount
      ),
      accommodation_assignment!inner (
        user_id,
        users (
          first_name,
          last_name
        )
      )
    `)
    .eq("accommodation_assignment.user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };

  const formatted = data.map((bill: any) => {
    const breakdown = bill.billing_item?.map((item: any) => ({
      label: item.type,
      amount: item.amount,
    })) || [];

    const charges = breakdown
      .filter((i: any) => i.amount > 0)
      .reduce((sum: number, i: any) => sum + i.amount, 0);

    const discounts = breakdown
      .filter((i: any) => i.amount < 0)
      .reduce((sum: number, i: any) => sum + i.amount, 0);

    return {
      ...bill,
      breakdown,
      summary: {
        charges,
        discounts,
        total: bill.amount,
      },
    };
  });

  return { data: formatted, error: null };
}

export async function getStudentPaymentHistory(user_id: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("payment_logs")
    .select(`
      billing_id,
      status,
      changed_by,
      created_at,
      billing!inner (
        amount,
        due_date,
        billing_period_date,
        accommodation_assignment!inner (
          user_id
        )
      )
    `)
    .eq("billing.accommodation_assignment.user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback for environments where payment_logs is not yet provisioned.
    if ((error as any)?.code === "PGRST205") {
      const { data: billingData, error: billingError } = await supabase
        .from("billing")
        .select(`
          billing_id,
          status,
          payment_method,
          transaction_reference,
          amount,
          due_date,
          billing_period_date,
          created_at,
          accommodation_assignment!inner (
            user_id
          )
        `)
        .eq("accommodation_assignment.user_id", user_id)
        .order("created_at", { ascending: false });

      if (billingError) return { data: null, error: billingError };
      return { data: billingData ?? [], error: null };
    }

    return { data: null, error };
  }

  return { data: data ?? [], error: null };
}

//======================================================//
// CRUD
//======================================================//

export async function createBilling(role: UserRole, billingData: BillingCreation) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();

  return await supabase.from("billing").insert([billingData]).select();
}


export async function getBillingInformation(user_id: string, role: string) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("billing")
    .select(`*, accommodation_assignment (user_id)`);

  if (role === "student") {
    query = query.eq("accommodation_assignment.user_id", user_id);
  }

  return await query;
}

export async function updateBillingInformation(
  role: UserRole,
  billing_id: string,
  billingData: Partial<BillingCreation>
) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();

  return await supabase
    .from("billing")
    .update({
      ...billingData,
      updated_at: new Date(),
    })
    .eq("billing_id", billing_id)
    .select();
}

export async function deleteBilling(role: UserRole, billing_id: string) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();

  return await supabase.from("billing").delete().eq("billing_id", billing_id);
}

//======================================================//
// PAYMENT FLOW
//======================================================//

export async function submitPayment(
  user_id: string,
  billing_id: string,
  reference: string,
  receiptFileId: string,
  method: string
) {
  const supabase = supabaseAdmin;

  const { data: existingBilling, error: fetchError } = await supabase
    .from("billing")
    .select("receipt_files")
    .eq("billing_id", billing_id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  const existingReceiptFiles = Array.isArray(existingBilling?.receipt_files)
    ? existingBilling.receipt_files
    : [];

  const { data, error } = await supabase
    .from("billing")
    .update({
      transaction_reference: reference,
      payment_method: method,
      receipt_files: [...existingReceiptFiles, receiptFileId],
    })
    .eq("billing_id", billing_id)
    .select()
    .single();

  await supabase.from("payment_logs").insert([
    {
      billing_id,
      status: BillingStatus.UNPAID,
      changed_by: user_id,
    },
  ]);

  return { data, error };
}

export async function approveReceipt(
  role: UserRole,
  billing_id: string,
  admin_id: string
) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = supabaseAdmin;

  const { data: billing, error: fetchError } = await supabase
    .from("billing")
    .select(`
      billing_id,
      accommodation_assignment (
        assignment_id,
        application_id
      )
    `)
    .eq("billing_id", billing_id)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  const result = await supabase
    .from("billing")
    .update({ status: BillingStatus.PAID })
    .eq("billing_id", billing_id)
    .select()
    .single();

  const assignmentRecord = Array.isArray(billing?.accommodation_assignment)
    ? billing.accommodation_assignment[0]
    : billing?.accommodation_assignment;

  const assignmentId = assignmentRecord?.assignment_id;
  const applicationId = assignmentRecord?.application_id;

  if (assignmentId) {
    await supabase
      .from("accommodation_assignment")
      .update({ assignment_status: "active" })
      .eq("assignment_id", assignmentId);
  }

  if (applicationId) {
    await supabase
      .from("accommodation_application")
      .update({ application_status: "approved" })
      .eq("application_id", applicationId);
  }

  await supabase.from("payment_logs").insert([
    { billing_id, status: BillingStatus.PAID, changed_by: admin_id },
  ]);

  return result;
}

export async function rejectReceipt(
  role: UserRole,
  billing_id: string,
  admin_id: string
) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();

  const result = await supabase
    .from("billing")
    .update({
      status: BillingStatus.FAILED,
      transaction_reference: null,
    })
    .eq("billing_id", billing_id)
    .select()
    .single();

  await supabase.from("payment_logs").insert([
    { billing_id, status: BillingStatus.FAILED, changed_by: admin_id },
  ]);

  return result;
}

//======================================================//
// AUTO OVERDUE
//======================================================//

export async function markOverdueBills() {
  const supabase = await createSupabaseServerClient();

  const now = new Date().toISOString();

  await supabase
    .from("billing")
    .update({ status: BillingStatus.OVERDUE })
    .lt("due_date", now)
    .eq("status", BillingStatus.UNPAID);
}

//======================================================//
// REVENUE
//======================================================//

export async function getRevenueSummary(role: UserRole) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .select("amount, status");

  let totalRevenue = 0;
  let collected = 0;
  let unpaid = 0;
  let overdue = 0;

  data?.forEach((bill: any) => {
    totalRevenue += bill.amount;

    if (bill.status === BillingStatus.PAID) collected += bill.amount;
    else if (bill.status === BillingStatus.UNPAID) unpaid += bill.amount;
    else if (bill.status === BillingStatus.OVERDUE) overdue += bill.amount;
  });

  return {
    data: { totalRevenue, collected, unpaid, overdue },
    error,
  };
}

//======================================================//
// STUDENT SUMMARY
//======================================================//

export async function getUserPaymentSummary(user_id: string, role: UserRole) {
  if (role !== "student" && role !== "guest") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .select(`
      amount,
      status,
      accommodation_assignment!inner (user_id)
    `)
    .eq("accommodation_assignment.user_id", user_id);

  let total = 0;
  let paid = 0;
  let balance = 0;

  data?.forEach((bill: any) => {
    total += bill.amount;
    if (bill.status === BillingStatus.PAID) paid += bill.amount;
    else balance += bill.amount;
  });

  return { data: { total, paid, balance }, error };
}

//======================================================//
// ADMIN BILLING VIEWS
//======================================================//

export async function getAllBillsForAdmin(role: UserRole) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("billing")
    .select(`
      billing_id,
      amount,
      billing_period_date,
      due_date,
      status,
      payment_method,
      transaction_reference,
      created_at,
      internal_notes,
      billing_item (
        type,
        amount
      ),
      accommodation_assignment (
        assignment_id,
        application_id,
        user_id,
        users (
          first_name,
          last_name
        ),
        accommodation_application (
          preferred_accommodation_id
        )
      )
    `)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function updateAdminInvoiceDetails(
  role: UserRole,
  billing_id: string,
  updates: {
    admin_flag?: boolean;
    internal_notes?: string;
    reminded_at?: string;
    amount?: number;
    due_date?: string;
    billing_period_date?: string;
    status?: BillingStatus;
    payment_method?: string;
  }
) {
  if (role !== "admin") return { data: null, error: "Unauthorized" };

  const supabase = await createSupabaseServerClient();

  return await supabase
    .from("billing")
    .update(updates)
    .eq("billing_id", billing_id)
    .select();
}

//======================================================//
// TENANT LOOKUP FOR ADMIN BILLING
//======================================================//

export async function getActiveTenants() {
  return await supabaseAdmin
    .from("accommodation_assignment")
    .select(`
      assignment_id,
      user_id,
      users (
        first_name,
        last_name
      )
    `)
    .in("assignment_status", ["active", "waiting_payment", "pending"]);
}
