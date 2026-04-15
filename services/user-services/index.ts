import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { AccomodationHistory } from "@/types/accomodation/accomodationHistory";
import { BillingCreation, BillingInformation } from "@/types/billing";
import { BillingStatus } from "@/types/billing/enums";

//======================================================//
// TYPES
//======================================================//

type UserRole = "student" | "admin";

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

  if (error) {
    console.error("Error fetching accommodation history:", error);
    return { data: null, error };
  }

  const flattened = data?.map(({ accommodation_assignment, ...app }: any) => ({
    ...app,
    ...(accommodation_assignment ?? {
      assignment_id: null,
      move_in_date: null,
      expected_move_out_date: null,
      actual_move_out_date: null,
      assignment_status: null,
    }),
  }));

  return { data: flattened as AccomodationHistory[] | null, error };
}

//======================================================//
// DOCUMENT SERVICES
//======================================================//

export async function insertDocument( 
  user_id: string,
  application_id: string,
  doc_name: string,
  file_url: string, 
  document_type: string
) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.rpc("insert_document_metadata", {
    p_uploader_id: user_id,
    p_application_id: application_id,
    p_doc_name: doc_name,
    p_doc_type: document_type,
    p_file_url: file_url,
  });

  if (error) {
    console.error("Error inserting document metadata:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

//======================================================//
// BILLING (CRUD + ROLE-BASED)
//======================================================//

// CREATE BILLING (ADMIN ONLY)
export async function createBilling(role: UserRole, billingData: BillingCreation) {
  if (role !== "admin") {
    return { data: null, error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .insert([billingData])
    .select();

  return { data, error };
}

// READ BILLING (ROLE-BASED)
export async function getBillingInformation(user_id: string, role: UserRole) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("billing")
    .select(`
      billing_id,
      amount,
      due_date,
      billing_period_date,
      status,
      created_at,
      payment_method,
      transaction_reference,
      assignment_id,
      accommodation_assignment (
        user_id
      )
    `);

  if (role === "student") {
    query = query.eq("accommodation_assignment.user_id", user_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching billing:", error);
    return { data: null, error };
  }

  return { data: data as BillingInformation[], error };
}

// UPDATE BILLING (ADMIN ONLY)
export async function updateBillingInformation(
  role: UserRole,
  assignment_id: string,
  billingData: Partial<BillingCreation>
) {
  if (role !== "admin") {
    return { data: null, error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .update({
      amount: billingData.amount,
      status: billingData.status,
      billing_period_date: billingData.billing_period_date,
      payment_method: billingData.payment_method,
    })
    .eq("assignment_id", assignment_id)
    .select();

  return { data, error };
}

// DELETE BILLING (ADMIN ONLY)
export async function deleteBilling(role: UserRole, billing_id: string) {
  if (role !== "admin") {
    return { data: null, error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .delete()
    .eq("billing_id", billing_id);

  return { data, error };
}

//======================================================//
// AUTO CREATE BILLING
//======================================================//

export async function ensureUserBilling(user_id: string) {
  const supabase = await createSupabaseServerClient();

  const { data: assignment, error: assignmentError } = await supabase
    .from("accommodation_assignment")
    .select("assignment_id")
    .eq("user_id", user_id)
    .maybeSingle();

  if (assignmentError || !assignment) {
    console.error("No assignment found:", assignmentError);
    return;
  }

  const { data: billing, error } = await supabase
    .from("billing")
    .select("billing_id")
    .eq("assignment_id", assignment.assignment_id)
    .maybeSingle();

  if (error) {
    console.error("Error checking billing:", error);
    return;
  }

  if (!billing) {
    await supabase.from("billing").insert([
      {
        assignment_id: assignment.assignment_id,
        amount: 0,
        due_date: new Date(),
        billing_period_date: new Date(),
        status: BillingStatus.UNPAID,
        created_at: new Date(),
        payment_method: "cash",
        transaction_reference: "",
      },
    ]);
  }
}

//======================================================//
// PAYMENT STATUS (ADMIN)
//======================================================//

export async function approveReceipt(role: UserRole, billing_id: string) {
  if (role !== "admin") {
    return { data: null, error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  return await supabase
    .from("billing")
    .update({ status: BillingStatus.PAID })
    .eq("billing_id", billing_id)
    .select()
    .single();
}

export async function rejectReceipt(role: UserRole, billing_id: string) {
  if (role !== "admin") {
    return { data: null, error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  return await supabase
    .from("billing")
    .update({
      status: BillingStatus.FAILED,
      transaction_reference: null,
    })
    .eq("billing_id", billing_id)
    .select()
    .single();
}

//======================================================//
// REVENUE LOGIC (ADMIN)
//======================================================//

export async function getRevenueSummary(role: UserRole) {
  if (role !== "admin") {
    return { data: null, error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .select("amount, status");

  if (error) {
    console.error("Error fetching revenue:", error);
    return { data: null, error };
  }

  let totalRevenue = 0;
  let collected = 0;
  let unpaid = 0;
  let overdue = 0;

  data.forEach((bill: any) => {
    totalRevenue += bill.amount;

    if (bill.status === BillingStatus.PAID) collected += bill.amount;
    if (bill.status === BillingStatus.UNPAID) unpaid += bill.amount;
    if (bill.status === BillingStatus.OVERDUE) overdue += bill.amount;
  });

  return {
    data: { totalRevenue, collected, unpaid, overdue },
    error: null,
  };
}

//======================================================//
// USER SUMMARY (STUDENT)
//======================================================//

export async function getUserPaymentSummary(user_id: string, role: UserRole) {
  if (role !== "student") {
    return { data: null, error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("billing")
    .select(`
      amount,
      status,
      accommodation_assignment (
        user_id
      )
    `)
    .eq("accommodation_assignment.user_id", user_id);

  if (error) {
    console.error("Error fetching summary:", error);
    return { data: null, error };
  }

  let total = 0;
  let paid = 0;
  let balance = 0;

  data.forEach((bill: any) => {
    total += bill.amount;
    if (bill.status === BillingStatus.PAID) paid += bill.amount;
    else balance += bill.amount;
  });

  return {
    data: { total, paid, balance },
    error: null,
  };
}