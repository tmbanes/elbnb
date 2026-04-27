import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { randomUUID } from "crypto";
import { submitPayment } from "@/services/user-services";

export const POST = withRole(['guest'], async (req: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const billingId = String(formData.get("billingId") || "");
    const file = formData.get("receiptFile");

    if (!billingId) {
      return NextResponse.json({ error: "Missing billingId" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing receipt file" }, { status: 400 });
    }

    const receiptId = randomUUID();
    const fileExtension = file.name.split(".").pop() || "bin";
    const storagePath = `${user.id}/${billingId}/${receiptId}.${fileExtension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("payment_receipts")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const result = await submitPayment(user.id, billingId, storagePath, receiptId, "cash");

    if (result.error) {
      return NextResponse.json(
        { error: typeof result.error === "string" ? result.error : result.error.message || "Failed to submit receipt." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, billing: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload receipt.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
