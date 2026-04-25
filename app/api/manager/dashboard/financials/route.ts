// app/api/manager/dashboard/financials/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(_req: NextRequest) {
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

    // Get accommodation managed by this user
    const { data: accommodationData, error: accomError } = await supabase
      .from("accommodation")
      .select("accommodation_id, name, total_capacity")
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
      .select("unit_id, rental_fee, max_occupancy, current_occupancy")
      .eq("accommodation_id", accommodationId);

    if (unitsError) throw new Error(unitsError.message);

    // Compute expected revenue = sum of (rental_fee * max_occupancy) across all units
    const expectedRevenue = (units ?? []).reduce(
      (sum, u) => sum + Number(u.rental_fee) * u.max_occupancy,
      0
    );

    const unitIds = (units ?? []).map((u) => u.unit_id);

    // Get all active assignments for these units
    const { data: assignments, error: assignError } = await supabase
      .from("accommodation_assignment")
      .select("assignment_id, user_id, unit_id, move_in_date")
      .eq("assignment_status", "active")
      .in("unit_id", unitIds.length > 0 ? unitIds : ["00000000-0000-0000-0000-000000000000"]);

    if (assignError) throw new Error(assignError.message);

    const assignmentIds = (assignments ?? []).map((a) => a.assignment_id);

    // Get all billing records for these assignments
    const { data: billings, error: billingError } = await supabase
      .from("billing")
      .select(
        "billing_id, assignment_id, amount, status, due_date, billing_period_date"
      )
      .in(
        "assignment_id",
        assignmentIds.length > 0
          ? assignmentIds
          : ["00000000-0000-0000-0000-000000000000"]
      );

    if (billingError) throw new Error(billingError.message);

    const paidBillings = (billings ?? []).filter((b) => b.status === "paid");
    const unpaidBillings = (billings ?? []).filter(
      (b) => b.status === "unpaid" || b.status === "overdue"
    );

    const actualCollected = paidBillings.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    );
    const outstandingBalance = unpaidBillings.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    );
    const unpaidInvoiceCount = unpaidBillings.length;
    const collectionRate =
      expectedRevenue > 0
        ? Math.round((actualCollected / expectedRevenue) * 100)
        : 0;

    // Build delinquency list: unpaid/overdue billings joined with user info
    const assignmentMap = new Map(
      (assignments ?? []).map((a) => [a.assignment_id, a])
    );
    const unitMap = new Map((units ?? []).map((u) => [u.unit_id, u]));

    // Get user profiles for residents with unpaid/overdue billing
    const delinquentUserIds = [
      ...new Set(
        unpaidBillings
          .map((b) => assignmentMap.get(b.assignment_id)?.user_id)
          .filter(Boolean) as string[]
      ),
    ];

    const { data: delinquentUsers } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, profile_picture_url")
      .in(
        "user_id",
        delinquentUserIds.length > 0
          ? delinquentUserIds
          : ["00000000-0000-0000-0000-000000000000"]
      );

    const userMap = new Map(
      (delinquentUsers ?? []).map((u) => [u.user_id, u])
    );

    const today = new Date();
    const delinquencyList = unpaidBillings
      .map((b) => {
        const assignment = assignmentMap.get(b.assignment_id);
        if (!assignment) return null;

        const userProfile = userMap.get(assignment.user_id);
        if (!userProfile) return null;

        const unitForAssignment = unitMap.get(assignment.unit_id);

        const dueDate = new Date(b.due_date);
        const daysOverdue = Math.max(
          0,
          Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        const initials =
          `${userProfile.first_name?.[0] ?? ""}${userProfile.last_name?.[0] ?? ""}`.toUpperCase();
        const unitNumber =
          units?.find((u) => u.unit_id === assignment.unit_id)?.unit_id ?? "N/A";

        return {
          billing_id: b.billing_id,
          user_id: assignment.user_id,
          name: `${userProfile.first_name} ${userProfile.last_name}`,
          initials,
          profile_picture_url: userProfile.profile_picture_url ?? null,
          unit_id: assignment.unit_id,
          move_in_date: assignment.move_in_date,
          amount: Number(b.amount),
          status: b.status === "overdue" ? "Overdue" : "Unpaid",
          due_date: b.due_date,
          days_overdue: daysOverdue,
        };
      })
      .filter(Boolean)
      // Sort by days_overdue descending (most overdue first)
      .sort((a: any, b: any) => b.days_overdue - a.days_overdue);

    // Attach the actual unit_number by looking up the unit_id in units array
    const unitNumberMap = new Map(
      (units ?? []).map((u) => [u.unit_id, u])
    );

    // Fetch unit numbers
    const { data: unitDetails } = await supabase
      .from("unit")
      .select("unit_id, unit_number")
      .in(
        "unit_id",
        unitIds.length > 0 ? unitIds : ["00000000-0000-0000-0000-000000000000"]
      );

    const unitNumberLookup = new Map(
      (unitDetails ?? []).map((u) => [u.unit_id, u.unit_number])
    );

    const delinquencyListWithUnitNumbers = delinquencyList.map((item: any) => ({
      ...item,
      unit_number: unitNumberLookup.get(item.unit_id) ?? "N/A",
    }));

    return NextResponse.json({
      expectedRevenue,
      actualCollected,
      outstandingBalance,
      unpaidInvoiceCount,
      collectionRate,
      delinquencyList: delinquencyListWithUnitNumbers,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch financial data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
