import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingId } = (await req.json().catch(() => ({}))) as { billingId?: string };

    if (!billingId) {
      return NextResponse.json({ error: "Missing billingId" }, { status: 400 });
    }

    const { data: billing, error: billingError } = await supabase
      .from("billing")
      .select(`
        billing_id,
        transaction_reference,
        receipt_files,
        status,
        accommodation_assignment!inner (
          user_id
        )
      `)
      .eq("billing_id", billingId)
      .eq("accommodation_assignment.user_id", user.id)
      .single();

    if (billingError || !billing) {
      return NextResponse.json({ error: "Billing record not found." }, { status: 404 });
    }

    if (billing.status === "paid" || billing.status === "paid_late") {
      return NextResponse.json(
        { error: "Cannot cancel receipt for an invoice that is already approved/paid." },
        { status: 409 },
      );
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

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel receipt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}