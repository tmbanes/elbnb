import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireApiRole } from "@/lib/auth/server-auth";

export async function POST(req: NextRequest) {
  // TO DO: Protect this API route. Make this only accessible to admin (if admin lang talaga pwede maka-access nito).
  // const auth = await requireApiRole(['housing_admin']);

  // if ("error" in auth) {
  //   return NextResponse.json(
  //     { error: auth.error },
  //     { status: auth.status }
  //   );
  // }

  // const user = auth.user;
  const { first_name, last_name, email, office_location } = await req.json();

  if (!first_name || !last_name || !email) {
    return NextResponse.json(
      { error: "first_name, last_name, and email are required" },
      { status: 400 }
    );
  }

  // inviteUserByEmail creates the account AND sends a password setup email
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      first_name,
      last_name,
      middle_name: "none",
      role: "dormitory_manager",
      user_status: "active",
      sex: "F",
      birthdate: "1900-01-01",
      office_location: office_location ?? "",
    },
  });

  if (error) {
    console.error("Supabase invite error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user_id: data.user.id }, { status: 201 });
}