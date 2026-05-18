import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(req: NextRequest) {
  try {
    const { id, accommodationId } = await req.json();

    if (!id || !accommodationId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // 1. Unset existing primary for this accommodation
    const { error: unsetError } = await supabase
      .from("accommodation_images")
      .update({ is_primary: false })
      .eq("accommodation_id", accommodationId);

    if (unsetError) throw new Error(unsetError.message);

    // 2. Set new primary
    const { error: setError } = await supabase
      .from("accommodation_images")
      .update({ is_primary: true })
      .eq("id", id);

    if (setError) throw new Error(setError.message);

    // 3. Optional: Sync with main accommodation table 'image' column
    const { data: primaryImg } = await supabase
        .from("accommodation_images")
        .select("url, storage_path")
        .eq("id", id)
        .single();
    
    if (primaryImg) {
        await supabase
            .from("accommodation")
            .update({ image: primaryImg.storage_path || primaryImg.url })
            .eq("accommodation_id", accommodationId);
    }


    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Set primary error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
