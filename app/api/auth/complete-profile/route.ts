import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
// import { getSupabaseAdmin } from "@/lib/supabase/admin-client";
import { College, UserRole } from "@/types/user.types";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

const validRoles: UserRole[] = ["student", "guest"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, middle_name, role, roleData } = body;

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
      middle_name
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
      const { valid_id, purpose_visit } = roleData;

      if (!valid_id || !purpose_visit) {
        return NextResponse.json({ success: false, error: "Incomplete guest data. Please fill out all fields." }, { status: 400 });
      }

      metadataUpdates.valid_id = valid_id;
      metadataUpdates.purpose_visit = purpose_visit;
    }

    // 2. AUTHENTICATE USER
    const supabase = await createSupabaseServerClient();
    const user = await getApiAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    // 3. UPDATE USERS TABLE
    const profileUpdate = await supabase
      .from("users")
      .update({
        first_name: first_name,
        last_name: last_name,
        middle_name: middle_name,
        role: role
      })
      .eq("user_id", user.user_id);

    if (profileUpdate.error) {
      return NextResponse.json({ success: false, error: profileUpdate.error.message }, { status: 500 });
    }

    // 4. INSERT INTO SUB-TABLES
    // Filter out top-level user fields for sub-table insertion
    const subtableFields = ["role", "first_name", "last_name", "middle_name"];
    const subtableData: Record<string, any> = {};
    Object.keys(metadataUpdates).forEach(key => {
      if (!subtableFields.includes(key)) {
        subtableData[key] = metadataUpdates[key];
      }
    });

    const roleInsert = await supabase
      .from(role)
      .update(subtableData)
      .eq("user_id", user.user_id);

    if (roleInsert.error) {
      // If insertion fails, it might be because it already exists, or the column doe snot exist in the schema. 
      console.error(`Error inserting into ${role} table:`, roleInsert.error);
      return NextResponse.json({ success: false, error: `Unable to save ${role} details: ` + roleInsert.error.message }, { status: 500 });
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
