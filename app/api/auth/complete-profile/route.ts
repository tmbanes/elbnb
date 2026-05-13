import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
// import { getSupabaseAdmin } from "@/lib/supabase/admin-client";
import { College, UserRole } from "@/types/user.types";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

const validRoles: UserRole[] = ["student", "guest"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, middle_name, role, sex, birthdate, roleData } = body;

    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role selection." }, { status: 400 });
    }

    if (!first_name || !last_name) {
      return NextResponse.json({ success: false, error: "First name and last name are required." }, { status: 400 });
    }

    const metadataUpdates: Record<string, unknown> = {
      role,
      first_name,
      last_name,
      middle_name,
      sex,
      birthdate
    };

    // 1. VALIDATE ROLE-SPECIFIC FIELDS
    if (role === "student") {
      const {
        student_num,
        degree_program,
        college,
        enrollment_status,
        home_address,
        emergency_person,
        emergency_contact
      } = roleData;

      if (!student_num || !degree_program || !college || !enrollment_status || !home_address || !emergency_person || !emergency_contact) {
        return NextResponse.json({ success: false, error: "Incomplete student data. Please fill out all fields." }, { status: 400 });
      }

      metadataUpdates.student_num = student_num;
      metadataUpdates.degree_program = degree_program;
      metadataUpdates.college = college;
      metadataUpdates.enrollment_status = enrollment_status;
      metadataUpdates.home_address = home_address;
      metadataUpdates.emergency_person = emergency_person;
      metadataUpdates.emergency_contact = emergency_contact;
      metadataUpdates.residency_status = "non-resident";
      metadataUpdates.violation_count = 0;
    }

    if (role === "guest") {
      const { valid_id, purpose_visit, emergency_person, emergency_contact, home_address } = roleData;

      if (!valid_id || !purpose_visit || !emergency_person || !emergency_contact || !home_address) {
        return NextResponse.json({ success: false, error: "Incomplete guest data. Please fill out all fields." }, { status: 400 });
      }

      metadataUpdates.valid_id = valid_id;
      metadataUpdates.purpose_visit = purpose_visit;
      metadataUpdates.emergency_person = emergency_person;
      metadataUpdates.emergency_contact = emergency_contact;
      metadataUpdates.home_address = home_address;
    }

    // 2. AUTHENTICATE USER
    const { supabaseAdmin } = await import("@/lib/supabase/admin-client");
    const supabase = await createSupabaseServerClient();
    const user = await getApiAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    // 3. UPDATE USERS TABLE (Requires RLS Policy: auth.uid() = user_id)
    // console.log("Completing profile for user:", user.user_id, "Data:", { first_name, last_name, role, sex });
    const { error: userError } = await supabase
      .from("users")
      .update({
        first_name: metadataUpdates.first_name as string,
        last_name: metadataUpdates.last_name as string,
        middle_name: metadataUpdates.middle_name as string,
        role: metadataUpdates.role as UserRole,
        sex: metadataUpdates.sex as string,
        birthdate: metadataUpdates.birthdate as string,
      })
      .eq("user_id", user.user_id);

    if (userError) {
      console.error("CRITICAL: Users table update failed:", userError);
      return NextResponse.json({ success: false, error: "Base profile update failed: " + userError.message }, { status: 500 });
    }

    // 4. UPDATE ROLE TABLES (Requires RLS Policy: auth.uid() = user_id for INSERT/UPDATE)
    // Fields that should ONLY go to the 'users' table
    const userOnlyFields = ["role", "first_name", "last_name", "middle_name", "sex", "birthdate"];

    const subtableData: Record<string, any> = {
      user_id: user.user_id,
      ...roleData // Include all role-specific data from the request
    };

    // Also include any other fields from metadataUpdates that are NOT in userOnlyFields
    Object.keys(metadataUpdates).forEach(key => {
      if (!userOnlyFields.includes(key)) {
        subtableData[key] = metadataUpdates[key];
      }
    });

    // console.log(`Updating ${role} table for ${user.user_id}:`, subtableData);
    const { error: roleError } = await supabase
      .from(role)
      .update(subtableData)
      .eq('user_id', user.user_id);

    if (roleError) {
      console.error(`CRITICAL: Role table (${role}) upsert failed:`, roleError);
      return NextResponse.json({ success: false, error: `Role-specific data failed: ` + roleError.message }, { status: 500 });
    }

    // 5. UPDATE AUTH METADATA
    const { error: metadataError } = await supabase.auth.updateUser({
      data: metadataUpdates,
    });

    if (metadataError) {
      return NextResponse.json({ success: false, error: "Profile updated but session metadata failed to sync: " + metadataError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json({ success: false, error: "Internal server error during profile completion." }, { status: 500 });
  }
}
