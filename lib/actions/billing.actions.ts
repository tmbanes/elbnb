"use server";

import { updateAdminInvoiceDetails, approveReceipt, rejectReceipt, createBillingWithItems, updateAdminInvoiceWithItems, submitPayment } from "@/services/user-services";
import { revalidatePath } from "next/cache";
import { BillingCreation } from "@/types/billing";
import { BillingItemType, BillingStatus } from "@/types/billing/enums";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { randomUUID } from "crypto";

function toErrorMessage(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : "";
  const details = error && typeof error === "object" && "details" in error
    ? String((error as { details?: unknown }).details ?? "")
    : "";

  if (message.includes("billing_status_check")) {
    return "Database constraint billing_status_check is blocking this status update (paid_late/partially_paid).";
  }

  if (details.includes("billing_status_check")) {
    return "Database constraint billing_status_check is blocking this status update (paid_late/partially_paid).";
  }

  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const rawMessage = (error as { message?: unknown }).message;
    if (typeof rawMessage === "string" && rawMessage.trim().length > 0) return rawMessage;
  }
  return "Operation failed.";
}

export async function adminUpdateInvoiceAction(
  billingId: string,
  updates: {
    internal_notes?: string;
    reminded_at?: string;
    due_date?: string;
    billing_period_date?: string;
    status?: BillingStatus;
    payment_method?: string;
  },
  items?: { type: BillingItemType; amount: number }[],
  adminId?: string
) {
  let result;
  const hasItems = Array.isArray(items) && items.length > 0;

  if (updates.status === BillingStatus.PAID && adminId) {
    result = await approveReceipt("admin", billingId, adminId);

    const { status: _status, ...rest } = updates;
    if (Object.keys(rest).length > 0) {
      if (hasItems) {
        await updateAdminInvoiceWithItems("admin", billingId, rest, items!);
      } else {
        await updateAdminInvoiceDetails("admin", billingId, rest);
      }
    }
  } else {
    if (hasItems) {
      result = await updateAdminInvoiceWithItems("admin", billingId, updates, items!);
    } else {
      result = await updateAdminInvoiceDetails("admin", billingId, updates);
    }
  }

  if (result?.error) throw new Error(toErrorMessage(result.error));

  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  return result;
}

export async function adminApproveReceiptAction(billingId: string, adminId: string) {
  const result = await approveReceipt("admin", billingId, adminId);
  if (result?.error) throw new Error(toErrorMessage(result.error));
  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/admin/applications");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  return result;
}

export async function adminRejectReceiptAction(billingId: string, adminId: string) {
  const result = await rejectReceipt("admin", billingId, adminId);
  if (result?.error) throw new Error(toErrorMessage(result.error));
  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  return result;
}

export async function adminCreateBillAction(
  billingData: BillingCreation,
  items: { type: BillingItemType; amount: number }[]
) {
  // First, check if an invoice already exists for this assignment
  if (billingData.assignment_id) {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("billing")
      .select("billing_id")
      .eq("assignment_id", billingData.assignment_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!fetchError && existing?.billing_id) {
      // Invoice already exists, update it instead of creating a new one
      const updateResult = await updateAdminInvoiceWithItems("admin", existing.billing_id, {
        internal_notes: billingData.internal_notes || undefined,
        due_date: billingData.due_date instanceof Date ? billingData.due_date.toISOString() : billingData.due_date,
        payment_method: billingData.payment_method,
      }, items);
      
      if (!updateResult?.error) {
        (updateResult as any).mode = "updated";
        revalidatePath("/admin/dashboard/billing");
        revalidatePath("/admin/billing");
        revalidatePath("/student/billing");
        revalidatePath("/guest/billing");
        return updateResult;
      }
    }
  }

  const result = await createBillingWithItems("admin", billingData, items);
  if (result?.error) throw new Error(toErrorMessage(result.error));
  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/admin/billing");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  return result;
}

export async function uploadReceiptAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const billingId = String(formData.get("billingId") || "");
  const file = formData.get("receiptFile") as File | null;

  if (!billingId) throw new Error("Missing billingId");
  if (!file) throw new Error("Missing receipt file");

  const receiptId = randomUUID();
  const fileExtension = file.name.split(".").pop() || "bin";
  const storagePath = `${user.id}/${billingId}/${receiptId}.${fileExtension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("payment_receipts")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const result = await submitPayment(user.id, billingId, storagePath, receiptId, "cash");

  if (result.error) throw new Error(toErrorMessage(result.error));

  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  revalidatePath("/admin/billing");

  return { success: true, billing: result.data };
}

export async function cancelReceiptAction(billingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: billing, error: billingError } = await supabase
    .from("billing")
    .select(`
      billing_id,
      transaction_reference,
      status,
      accommodation_assignment!inner (user_id)
    `)
    .eq("billing_id", billingId)
    .eq("accommodation_assignment.user_id", user.id)
    .single();

  if (billingError || !billing) throw new Error("Billing record not found.");
  if (billing.status === "paid" || billing.status === "paid_late") {
    throw new Error("Cannot cancel receipt for an invoice that is already approved/paid.");
  }

  const receiptPath = billing.transaction_reference || null;

  if (receiptPath) {
    await supabaseAdmin.storage.from("payment_receipts").remove([receiptPath]);
  }

  const { error: updateError } = await supabaseAdmin
    .from("billing")
    .update({
      transaction_reference: null,
      receipt_files: null,
      status: "unpaid",
    })
    .eq("billing_id", billingId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  revalidatePath("/admin/billing");

  return { success: true };
}

export async function getReceiptSignedUrl(path: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabaseAdmin.storage
    .from("payment_receipts")
    .createSignedUrl(path, 60 * 10);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
