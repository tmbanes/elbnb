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
  updates: { admin_flag?: boolean; internal_notes?: string; reminded_at?: string }
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
