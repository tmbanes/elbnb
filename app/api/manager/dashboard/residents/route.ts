import { withRole } from "@/lib/auth/api-guard";
// app/api/manager/dashboard/residents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export const GET = withRole(['dormitory_manager', 'housing_admin'], async (_req: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (
      !profile ||
      !["dormitory_manager", "housing_admin"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the accommodation managed by this user
    const { data: accommodationData, error: accomError } = await supabase
      .from("accommodation")
      .select("accommodation_id, name")
      .eq("manager_id", user.id)
      .single();

    if (accomError || !accommodationData) {
      return NextResponse.json(
        { error: "No accommodation found for this manager." },
        { status: 404 }
      );
    }

    const accommodationId = accommodationData.accommodation_id;

    // Get all units for this accommodation
    const { data: units, error: unitsError } = await supabase
      .from("unit")
      .select("unit_id, unit_number, max_occupancy, current_occupancy")
      .eq("accommodation_id", accommodationId);

    if (unitsError) throw new Error(unitsError.message);

    const unitIds = (units ?? []).map((u) => u.unit_id);

    // Get active assignments with user + student info joined
    const { data: assignments, error: assignError } = await supabase
      .from("accommodation_assignment")
      .select(
        `
        assignment_id,
        user_id,
        unit_id,
        move_in_date,
        assignment_status,
        users:user_id (
          first_name,
          last_name,
          email,
          sex,
          profile_picture_url
        )
      `
      )
      .eq("assignment_status", "active")
      .in("unit_id", unitIds.length > 0 ? unitIds : ["00000000-0000-0000-0000-000000000000"]);

    if (assignError) throw new Error(assignError.message);

    // Get student details for these users (for student_num, college, degree_program)
    const userIds = [...new Set((assignments ?? []).map((a) => a.user_id))];

    const { data: students } = await supabase
      .from("student")
      .select("user_id, student_num, college, degree_program, enrollment_status")
      .in(
        "user_id",
        userIds.length > 0
          ? userIds
          : ["00000000-0000-0000-0000-000000000000"]
      );

    const studentMap = new Map(
      (students ?? []).map((s) => [s.user_id, s])
    );

    // Get billing status for residents (latest billing per assignment)
    const assignmentIds = (assignments ?? []).map((a) => a.assignment_id);

    const { data: billings } = await supabase
      .from("billing")
      .select("billing_id, assignment_id, status, due_date")
      .in(
        "assignment_id",
        assignmentIds.length > 0
          ? assignmentIds
          : ["00000000-0000-0000-0000-000000000000"]
      )
      .order("due_date", { ascending: false });

    // Map latest billing status per assignment
    const latestBillingMap = new Map<string, string>();
    (billings ?? []).forEach((b) => {
      if (!latestBillingMap.has(b.assignment_id)) {
        latestBillingMap.set(b.assignment_id, b.status);
      }
    });

    const unitMap = new Map((units ?? []).map((u) => [u.unit_id, u]));

    const residents = (assignments ?? []).map((asg) => {
      const userInfo = asg.users as any;
      const studentInfo = studentMap.get(asg.user_id);
      const unitInfo = unitMap.get(asg.unit_id);
      const billingStatus = latestBillingMap.get(asg.assignment_id) ?? "unknown";

      const paymentStatus =
        billingStatus === "paid"
          ? "Cleared"
          : billingStatus === "overdue"
          ? "Overdue"
          : billingStatus === "unpaid"
          ? "Pending"
          : "Unknown";

      const initials =
        `${userInfo?.first_name?.[0] ?? ""}${userInfo?.last_name?.[0] ?? ""}`.toUpperCase();

      return {
        user_id: asg.user_id,
        assignment_id: asg.assignment_id,
        name: userInfo
          ? `${userInfo.first_name} ${userInfo.last_name}`
          : "Unknown",
        initials,
        email: userInfo?.email ?? "",
        profile_picture_url: userInfo?.profile_picture_url ?? null,
        student_number: studentInfo?.student_num ?? "N/A",
        college: studentInfo?.college ?? "N/A",
        degree_program: studentInfo?.degree_program ?? "N/A",
        room_number: unitInfo?.unit_number ?? "N/A",
        unit_id: asg.unit_id,
        move_in_date: asg.move_in_date,
        payment_status: paymentStatus,
        gender: userInfo?.sex ?? "N/A",
      };
    });

    // Waitlist: applications with status 'approved' for this accommodation
    const { data: waitlistApps, error: waitlistError } = await supabase
      .from("accommodation_application")
      .select(
        `
        application_id,
        user_id,
        date_submitted,
        preferred_unit_type,
        check_in,
        duration_of_stay,
        users:user_id (
          first_name,
          last_name,
          email,
          sex,
          profile_picture_url
        )
      `
      )
      .eq("preferred_accommodation_id", accommodationId)
      .eq("application_status", "approved")
      .order("date_submitted", { ascending: true });

    if (waitlistError) throw new Error(waitlistError.message);

    const waitlistUserIds = (waitlistApps ?? []).map((a) => a.user_id);

    const { data: waitlistStudents } = await supabase
      .from("student")
      .select("user_id, student_num, college, degree_program")
      .in(
        "user_id",
        waitlistUserIds.length > 0
          ? waitlistUserIds
          : ["00000000-0000-0000-0000-000000000000"]
      );

    const waitlistStudentMap = new Map(
      (waitlistStudents ?? []).map((s) => [s.user_id, s])
    );

    const waitlist = (waitlistApps ?? []).map((app) => {
      const userInfo = app.users as any;
      const studentInfo = waitlistStudentMap.get(app.user_id);
      const initials =
        `${userInfo?.first_name?.[0] ?? ""}${userInfo?.last_name?.[0] ?? ""}`.toUpperCase();

      return {
        application_id: app.application_id,
        user_id: app.user_id,
        name: userInfo
          ? `${userInfo.first_name} ${userInfo.last_name}`
          : "Unknown",
        initials,
        email: userInfo?.email ?? "",
        profile_picture_url: userInfo?.profile_picture_url ?? null,
        student_number: studentInfo?.student_num ?? "N/A",
        college: studentInfo?.college ?? "N/A",
        degree_program: studentInfo?.degree_program ?? "N/A",
        date_submitted: app.date_submitted,
        preferred_unit_type: app.preferred_unit_type,
        gender: userInfo?.sex ?? "N/A",
      };
    });

    return NextResponse.json({
      residents,
      waitlist,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch residents data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
