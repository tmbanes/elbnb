"use server";

import { updateAdminInvoiceDetails, approveReceipt, rejectReceipt, createBillingWithItems, updateAdminInvoiceWithItems, getExistingInvoiceForAssignment } from "@/services/user-services";
import { revalidatePath } from "next/cache";
import { BillingCreation } from "@/types/billing";
import { BillingItemType, BillingStatus } from "@/types/billing/enums";

function toErrorMessage(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : "";
  const details = error && typeof error === "object" && "details" in error
    ? String((error as { details?: unknown }).details ?? "")
    : "";

  if (message.includes("billing_status_check")) {
    return "Database constraint billing_status_check is blocking this status update (paid_late/partially_paid). Run supabase/fixes/2026-04-24_fix_billing_status_check.sql in Supabase SQL Editor.";
  }

  if (details.includes("billing_status_check")) {
    return "Database constraint billing_status_check is blocking this status update (paid_late/partially_paid). Run supabase/fixes/2026-04-24_fix_billing_status_check.sql in Supabase SQL Editor.";
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

  if (result?.error) {
    throw new Error(toErrorMessage(result.error));
  }

  revalidatePath("/admin/billing");
  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  return result;
}

export async function adminApproveReceiptAction(billingId: string, adminId: string) {
  const result = await approveReceipt("admin", billingId, adminId);
  if (result?.error) {
    throw new Error(toErrorMessage(result.error));
  }
  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/applications");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  return result;
}

export async function adminRejectReceiptAction(billingId: string, adminId: string) {
  const result = await rejectReceipt("admin", billingId, adminId);
  if (result?.error) {
    throw new Error(toErrorMessage(result.error));
  }
  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/admin/billing");
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
    const existingResult = await getExistingInvoiceForAssignment(billingData.assignment_id);
    
    if (existingResult?.data?.billing_id) {
      // Invoice already exists, update it instead of creating a new one
      const updateResult = await updateAdminInvoiceWithItems("admin", existingResult.data.billing_id, {
        internal_notes: billingData.internal_notes || undefined,
        due_date: billingData.due_date?.toISOString(),
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

  // No existing invoice, try to create a new one
  const result = await createBillingWithItems("admin", billingData, items);
  
  if (result?.error) {
    throw new Error(toErrorMessage(result.error));
  }

  revalidatePath("/admin/dashboard/billing");
  revalidatePath("/admin/billing");
  revalidatePath("/student/billing");
  revalidatePath("/guest/billing");
  return result;
}
