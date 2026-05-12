import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { randomInt, randomUUID } from "node:crypto";
import { sendManagerAccountCreatedEmail } from "@/services/notification/email_service";

const PASSWORD_LENGTH = 12;
const UPPERCASE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghjkmnpqrstuvwxyz";
const NUMBER_CHARS = "23456789";
const SPECIAL_CHARS = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const ALL_PASSWORD_CHARS =
  UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SPECIAL_CHARS;

function pickRandomChar(charset: string): string {
  return charset[randomInt(0, charset.length)];
}

function shuffleSecure(values: string[]): string[] {
  const shuffled = [...values];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function generateTempPassword(length = PASSWORD_LENGTH): string {
  if (length < 12) {
    throw new Error("Temporary password length must be at least 12 characters.");
  }

  const requiredChars = [
    pickRandomChar(UPPERCASE_CHARS),
    pickRandomChar(LOWERCASE_CHARS),
    pickRandomChar(NUMBER_CHARS),
    pickRandomChar(SPECIAL_CHARS),
  ];

  const remainingLength = length - requiredChars.length;
  const randomChars = Array.from({ length: remainingLength }, () =>
    pickRandomChar(ALL_PASSWORD_CHARS)
  );

  return shuffleSecure([...requiredChars, ...randomChars]).join("");
}

async function cleanupDormManagerByUserId(userId: string) {
  // Order matters due to FK constraints.
  await supabaseAdmin.from("dormitory_manager").delete().eq("user_id", userId);
  await supabaseAdmin.from("users").delete().eq("user_id", userId);
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

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
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  if (!first_name || !last_name || !normalizedEmail) {
    return NextResponse.json(
      { error: "first_name, last_name, and email are required" },
      { status: 400 }
    );
  }

  const tempPassword = generateTempPassword();
  const employeeId = randomUUID();

  async function createManagerAuthUserOnce() {
    return await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        middle_name: "none",
        role: "dormitory_manager",
        employee_id: employeeId,
        user_status: "active",
        must_reset_password: true,
        sex: "F",
        birthdate: "1900-01-01",
        office_location: office_location ?? "",
      },
    });
  }

  const { data: created, error: createError } = await createManagerAuthUserOnce();
  let createdUser = created.user;

  if (createError) {
    // If a stale partial row exists, try cleanup then retry once.
    if (createError.code === "unexpected_failure") {
      const { data: existingUser } = await (supabaseAdmin
        .from("users")
        .select("user_id, role")
        .eq("email", normalizedEmail)
        .maybeSingle() as any);

      if (existingUser?.user_id && existingUser.role === "dormitory_manager") {
        await cleanupDormManagerByUserId(existingUser.user_id);
        const { data: retried, error: retryError } =
          await createManagerAuthUserOnce();

        if (retryError) {
          console.error("Supabase createUser error:", retryError);
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }

        createdUser = retried.user;
      } else {
        console.error("Supabase createUser error:", createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    } else if (
      createError.code === "email_exists" ||
      createError.code === "user_already_exists"
    ) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    } else {
      console.error("Supabase createUser error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
  }

  const createdUserId = createdUser?.id;
  if (!createdUserId) {
    return NextResponse.json(
      { error: "Failed to create manager auth account." },
      { status: 500 }
    );
  }

  let emailSent = false;
  let emailError: string | null = null;

  try {
    await sendManagerAccountCreatedEmail({
      to: normalizedEmail,
      name: `${first_name} ${last_name}`.trim(),
      tempPass: tempPassword,
    });
    emailSent = true;
  } catch (err: any) {
    // Do not block account creation if email fails (e.g., missing RESEND_API_KEY).
    emailError = err?.message ?? "Failed to send email.";
    console.error("Resend manager account email error:", err);
  }

  return NextResponse.json(
    {
      user_id: createdUserId,
      temporary_password: tempPassword,
      email_sent: emailSent,
      email_error: emailError,
      message:
        emailSent
          ? "Dorm manager account created and email was sent to the manager."
          : "Dorm manager account created. Email could not be sent; copy the temporary password and share it securely.",
    },
    { status: 201 }
  );
}