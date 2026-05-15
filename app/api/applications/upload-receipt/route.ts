import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { ensureInitialInvoicesForUser, submitPayment } from "@/services/user-services";

export const POST = withRole(['student'], async (req: NextRequest, { user }) => {
  try {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const applicationId = String(formData.get("applicationId") || "");
    const file = formData.get("receiptFile");

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing receipt file" }, { status: 400 });
    }

    await ensureInitialInvoicesForUser(user.user_id);

    const { data: billingData, error: billingError } = await supabaseAdmin
      .from("billing")
      .select(`
        billing_id,
        accommodation_assignment!inner (
          application_id,
          user_id
        )
      `)
      .eq("accommodation_assignment.application_id", applicationId)
      .eq("accommodation_assignment.user_id", user.user_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (billingError) {
      return NextResponse.json({ error: billingError.message }, { status: 500 });
    }

    const billingRecord = (billingData as any)?.[0];

    if (!billingRecord?.billing_id) {
      return NextResponse.json({ error: "No billing record found for this application." }, { status: 404 });
    }


    const receiptId = randomUUID();
    const fileExtension = file.name.split(".").pop() || "bin";
    const storagePath = `${user.user_id}/${billingRecord.billing_id}/${receiptId}.${fileExtension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("payment_receipts")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const result = await submitPayment(user.user_id, billingRecord.billing_id, storagePath, receiptId, "cash");

    if (result.error) {
      return NextResponse.json(
        { error: typeof result.error === "string" ? result.error : result.error.message || "Failed to submit receipt." },
        { status: 500 },
      );
    }

    revalidatePath("/student/application");
    revalidatePath("/student/billing");
    revalidatePath("/admin/billing");
    revalidatePath("/admin/dashboard/billing");

    return NextResponse.json({ success: true, billing: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload receipt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
