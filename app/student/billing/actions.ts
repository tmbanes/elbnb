"use server";

import { submitPayment } from "@/services/user-services";

export async function processPaymentAction(
  userId: string,
  billingId: string,
  referencePath: string
) {
  // We strictly use "cash" method
  return await submitPayment(userId, billingId, referencePath, "cash");
}
