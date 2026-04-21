"use server";

import { submitPayment } from "@/services/user-services";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { randomUUID } from "crypto";

export async function processPaymentAction(
  userId: string,
  billingId: string,
  receiptFile: File
) {
  const receiptId = randomUUID();
  const fileExtension = receiptFile.name.split(".").pop() || "bin";
  const storagePath = `${userId}/${billingId}/${receiptId}.${fileExtension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("payment_receipts")
    .upload(storagePath, receiptFile, {
      contentType: receiptFile.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  // We strictly use "cash" method
  return await submitPayment(userId, billingId, storagePath, receiptId, "cash");
}
