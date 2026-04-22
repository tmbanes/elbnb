<<<<<<< HEAD
"use server";

import { updateAdminInvoiceDetails, approveReceipt, rejectReceipt, createBillingWithItems } from "@/services/user-services";
import { revalidatePath } from "next/cache";
import { BillingCreation } from "@/types/billing";
import { BillingItemType, BillingStatus } from "@/types/billing/enums";

export async function adminUpdateInvoiceAction(
  billingId: string,
  updates: {
    admin_flag?: boolean;
    internal_notes?: string;
    reminded_at?: string;
    amount?: number;
    due_date?: string;
    billing_period_date?: string;
    status?: BillingStatus;
    payment_method?: string;
  },
  adminId?: string
) {
  let result;

  if (updates.status === BillingStatus.PAID && adminId) {
    result = await approveReceipt("admin", billingId, adminId);

    const { status: _status, ...rest } = updates;
    if (Object.keys(rest).length > 0) {
      await updateAdminInvoiceDetails("admin", billingId, rest);
    }
  } else {
    result = await updateAdminInvoiceDetails("admin", billingId, updates);
  }

  revalidatePath("/admin/billing");
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

=======
"use server";

import { updateAdminInvoiceDetails, approveReceipt, rejectReceipt, createBillingWithItems } from "@/services/user-services";
import { revalidatePath } from "next/cache";
import { BillingCreation } from "@/types/billing";
import { BillingItemType, BillingStatus } from "@/types/billing/enums";

export async function adminUpdateInvoiceAction(
  billingId: string,
  updates: {
    admin_flag?: boolean;
    internal_notes?: string;
    reminded_at?: string;
    amount?: number;
    due_date?: string;
    billing_period_date?: string;
    status?: BillingStatus;
    payment_method?: string;
  },
  adminId?: string
) {
  let result;

  if (updates.status === BillingStatus.PAID && adminId) {
    result = await approveReceipt("admin", billingId, adminId);

    const { status: _status, ...rest } = updates;
    if (Object.keys(rest).length > 0) {
      await updateAdminInvoiceDetails("admin", billingId, rest);
    }
  } else {
    result = await updateAdminInvoiceDetails("admin", billingId, updates);
  }

  revalidatePath("/admin/billing");
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

>>>>>>> feature/admin-billing-ui
