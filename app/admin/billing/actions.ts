"use server";

import { updateAdminInvoiceDetails, approveReceipt, rejectReceipt, createBillingWithItems, updateAdminInvoiceWithItems } from "@/services/user-services";
import { revalidatePath } from "next/cache";
import { BillingCreation } from "@/types/billing";
import { BillingItemType, BillingStatus } from "@/types/billing/enums";

function toErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) return message;
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
