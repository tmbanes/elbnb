import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { withRole } from "@/lib/auth/api-guard";

export const POST = withRole(['housing_admin', 'admin'], async (req: Request) => {
  try {
    const { email, password, first_name, last_name, office_location } = await req.json();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role: "dormitory_manager" },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    const { data, error } = await supabaseAdmin.rpc("create_dormitory_manager", {
      p_user_id: authData.user.id,
      p_first_name: first_name,
      p_last_name: last_name,
      p_email: email,
      p_office_location: office_location,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
