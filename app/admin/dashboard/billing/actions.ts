"use server";

import { updateAdminInvoiceDetails, approveReceipt, rejectReceipt, createBillingWithItems } from "@/services/user-services";
import { revalidatePath } from "next/cache";
import { BillingCreation } from "@/types/billing";
import { BillingItemType } from "@/types/billing/enums";

export async function adminUpdateInvoiceAction(
  billingId: string,
  updates: { admin_flag?: boolean; internal_notes?: string; reminded_at?: string }
) {
  const result = await updateAdminInvoiceDetails("admin", billingId, updates);
  revalidatePath("/admin/dashboard/billing");
  return result;
}

export async function adminApproveReceiptAction(billingId: string, adminId: string) {
  const result = await approveReceipt("admin", billingId, adminId);
  revalidatePath("/admin/dashboard/billing");
  return result;
}

export async function adminRejectReceiptAction(billingId: string, adminId: string) {
  const result = await rejectReceipt("admin", billingId, adminId);
  revalidatePath("/admin/dashboard/billing");
  return result;
}

export async function adminCreateBillAction(
  billingData: BillingCreation,
  items: { type: BillingItemType; amount: number }[]
) {
  const result = await createBillingWithItems("admin", billingData, items);
  revalidatePath("/admin/dashboard/billing");
  return result;
}

