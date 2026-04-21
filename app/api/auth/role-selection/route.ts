import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { UserRole } from "@/types/user.types";

const validRoles: UserRole[] = ["student", "guest"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = body?.role as UserRole | undefined;

    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role selection." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const roleUpdate = await supabase
      .from("users")
      .update({ role })
      .eq("user_id", user.id);

    if (roleUpdate.error) {
      return NextResponse.json({ success: false, error: roleUpdate.error.message }, { status: 500 });
    }

    const metadataUpdates: Record<string, unknown> = {};

    // STUDENTS: student_number, degree_program, enrollment_status, residency_status, violation_count
    if (role === "student") {
      const {
        student_number,
        degree_program,
        enrollment_status,
        residency_status,
      } = body;

<<<<<<< HEAD
      if (!student_number || !degree_program || !enrollment_status || !residency_status) {
        return NextResponse.json({ success: false, error: "Incomplete student data." }, { status: 400 });
      }
=======
      // if (!student_number || !degree_program || !enrollment_status || !residency_status) {
      //   return NextResponse.json({ success: false, error: "Incomplete student data." }, { status: 400 });
      // }
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1

      metadataUpdates.student_number = student_number;
      metadataUpdates.degree_program = degree_program;
      metadataUpdates.enrollment_status = enrollment_status;
      metadataUpdates.residency_status = residency_status;
      metadataUpdates.violation_count = 0;
    }

    //GUESTS: valid_id, purpose_visit, occupancy_status
    if (role === "guest") {
      const { valid_id, purpose_visit, occupancy_status } = body;

<<<<<<< HEAD
      if (!valid_id || !purpose_visit || !occupancy_status) {
        return NextResponse.json({ success: false, error: "Incomplete guest data." }, { status: 400 });
      }
=======
      // if (!valid_id || !purpose_visit || !occupancy_status) {
      //   return NextResponse.json({ success: false, error: "Incomplete guest data." }, { status: 400 });
      // }
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1

      metadataUpdates.valid_id = valid_id;
      metadataUpdates.purpose_visit = purpose_visit;
      metadataUpdates.occupancy_status = occupancy_status;
    }

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
    return NextResponse.json({ success: false, error: "Unable to set role." }, { status: 500 });
  }
}
