import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getSupabaseAdmin } from "@/lib/supabase/admin-client";
import { College, UserRole } from "@/types/user.types";

const validRoles: UserRole[] = ["student", "guest"];

type StudentRoleData = {
  role: UserRole;
  student_number: string;
  degree_program: string;
  college: College;
  enrollment_status: "enrolled" | "loa" | "awol";
  emergency_person: string,
  emergency_contact: string;
  home_address: string;
};

type GuestRoleData = {
  valid_id: string;
  purpose_visit: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both flat body and nested roleData formats
    const payload = body.roleData || body;
    const role = payload?.role as UserRole | undefined;

    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role selection." }, { status: 400 });
    }

    const metadataUpdates: Record<string, unknown> = { role };

    // 1. VALIDATE ALL FIELDS BEFORE ANY DATABASE UPDATES
    if (role === "student") {
      const {
        student_number,
        degree_program,
        college,
        enrollment_status,
        home_address,
        emergency_person,
        emergency_contact
      } = payload;

      if (!student_number || !degree_program || !college || !enrollment_status || !home_address || !emergency_person || !emergency_contact) {
        return NextResponse.json({ success: false, error: "Incomplete student data. Please fill out all fields." }, { status: 400 });
      }

      metadataUpdates.student_number = student_number;
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
      // const { valid_id, purpose_visit, occupancy_status } = payload;
      const { valid_id, purpose_visit } = payload;

      if (!valid_id || !purpose_visit) {
        return NextResponse.json({ success: false, error: "Incomplete guest data. Please fill out all fields." }, { status: 400 });
      }

      metadataUpdates.valid_id = valid_id;
      metadataUpdates.purpose_visit = purpose_visit;
      // metadataUpdates.occupancy_status = occupancy_status;
    }

    // 2. AUTHENTICATE USER
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    // 3. EXECUTE UPDATES ONLY IF VALIDATION PASSED
    const roleUpdate = await supabase
      .from("users")
      .update({ role })
      .eq("user_id", user.id);

    if (roleUpdate.error) {
      return NextResponse.json({ success: false, error: roleUpdate.error.message }, { status: 500 });
    }

    // 4. INSERT INTO SUB-TABLES
    const { role: _removedRole, ...subtableData } = metadataUpdates;

    const adminClient = getSupabaseAdmin();
    const roleInsert = await adminClient
      .from(role)
      .insert({ user_id: user.id, ...subtableData });

    if (roleInsert.error) {
      return NextResponse.json({ success: false, error: roleInsert.error.message }, { status: 500 });
    }


    // IMPORTANT: We MUST also update auth.users metadata.
    // If we don't, the user's session JWT won't have the role, 
    // and `getApiAuthenticatedUser()` will still think they have no role!
    if (Object.keys(metadataUpdates).length > 0) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: metadataUpdates,
      });

      if (metadataError) {
        return NextResponse.json({ success: false, error: metadataError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Role selection error:", error);
    return NextResponse.json({ success: false, error: "Unable to set user role and metadata." }, { status: 500 });
  }
}
