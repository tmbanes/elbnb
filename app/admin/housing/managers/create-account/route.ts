import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { randomBytes } from "crypto";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

function generatePassword(): string {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const all = upper + lower + digits + special;

  const bytes = randomBytes(12);

  // Guarantee at least one of each character class
  let parts = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    special[bytes[3] % special.length],
  ];

  for (let i = 4; i < 12; i++) {
    parts.push(all[bytes[i] % all.length]);
  }

  // Shuffle so the guaranteed chars aren't always at the front
  for (let i = parts.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }

  return parts.join("");
}

// POST /api/housing/managers/create-account
// Creates a Supabase Auth user. The handle_new_user trigger automatically
// inserts into public.users AND public.dormitory_manager using the metadata.
export async function POST(req: NextRequest) {
  const { first_name, last_name, email, office_location } = await req.json();

  if (!first_name || !last_name || !email) {
    return NextResponse.json(
      { error: "first_name, last_name, and email are required" },
      { status: 400 }
    );
  }

  // Security check: ensure requester is an authenticated housing admin
  const user = await getApiAuthenticatedUser();
  if (!user || user.role !== "housing_admin") {
    return NextResponse.json(
      { error: "Unauthorized. Only housing administrators can create manager accounts." },
      { status: 403 }
    );
  }

  const password = generatePassword();
  // employee_id must be passed so the trigger's INSERT into
  // dormitory_manager does not fail the NOT NULL constraint
  const employee_id = crypto.randomUUID();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip verification — admin handles onboarding
    user_metadata: {
      first_name,
      last_name,
      middle_name: "none",
      role: "dormitory_manager",
      user_status: "active",
      office_location: office_location ?? "",
      employee_id, // consumed by handle_new_user trigger
      // trigger requires these with defaults
      sex: "F",
      birthdate: "1900-01-01",
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // temporary_password is returned ONCE to match frontend expectations
  return NextResponse.json(
    {
      user_id: data.user.id,
      employee_id,
      temporary_password: password,
    },
    { status: 201 }
  );
}