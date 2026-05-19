import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { withRole } from "@/lib/auth/api-guard";

export const POST = withRole(['housing_admin', 'admin'], async (req: Request) => {
  try {
    const { email, password: reqPassword, first_name, last_name, office_location } = await req.json();

    // Generate a temporary password if one isn't provided
    const password = reqPassword || Math.random().toString(36).slice(-10) + "A1!";

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role: "dormitory_manager" },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    // The database trigger automatically creates the `users` and `dormitory_manager` records 
    // when `createUser` is called with role 'dormitory_manager'.
    // We just need to update the newly created `dormitory_manager` record with the office location.
    const { data, error } = await supabaseAdmin
      .from("dormitory_manager")
      .update({ office_location })
      .eq("user_id", authData.user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...data, temporary_password: password }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
