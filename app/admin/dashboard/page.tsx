import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { userProfileService } from "@/services/user_profile";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/sign-in");

  // 1. All accommodations
  const { data: accommodations } = await supabase
    .from("accommodation")
    .select("accommodation_id, name, location, accommodation_type, accommodation_status, total_capacity");

  // 2. All units with occupancy info
  const { data: units } = await supabase
    .from("unit")
    .select("unit_id, accommodation_id, unit_number, unit_type, max_occupancy, current_occupancy, unit_status, rental_fee");

  // 3. Active assignments (students currently housed)
  const { data: activeAssignments } = await supabase
    .from("accommodation_assignment")
    .select("assignment_id, user_id, unit_id, move_in_date, expected_move_out_date, assignment_status")
    .eq("assignment_status", "active");

  // 4. Pending applications (waiting list)
  const { data: pendingApplications } = await supabase
    .from("accommodation_application")
    .select("application_id, user_id, application_status, date_submitted, preferred_accommodation_id, preferred_unit_type, users(first_name, last_name, email), accommodation(name)")
    .in("application_status", ["pending_admin", "pending_dorm_manager"])
    .order("date_submitted", { ascending: false });

  // 5. Recent applications (all statuses, latest 8)
  const { data: recentApplications } = await supabase
    .from("accommodation_application")
    .select("application_id, user_id, application_status, date_submitted, preferred_unit_type, users(first_name, last_name, email), accommodation(name)")
    .order("date_submitted", { ascending: false })
    .limit(8);

  // 6. Billing data
  const { data: allBilling } = await supabase
    .from("billing")
    .select("billing_id, amount, status, due_date, created_at, assignment_id");

  // 7. Students currently housed with details
  const { data: housedStudents } = await supabase
    .from("accommodation_assignment")
    .select("assignment_id, user_id, unit_id, move_in_date, expected_move_out_date, assignment_status, users(first_name, last_name, email), unit(unit_number, accommodation(name))")
    .eq("assignment_status", "active")
    .limit(20);

  // Compute derived data
  const totalProperties = accommodations?.length ?? 0;
  const activeUnits = units?.filter(u => u.unit_status === "active") ?? [];
  const totalUnits = activeUnits.length;
  const occupiedUnits = activeUnits.filter(u => u.current_occupancy > 0).length;
  const availableUnits = totalUnits - occupiedUnits;
  const studentsHoused = activeAssignments?.length ?? 0;
  const waitingListCount = pendingApplications?.length ?? 0;

  // Revenue this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyBilling = allBilling?.filter(b => b.created_at && b.created_at >= startOfMonth) ?? [];
  const revenueThisMonth = monthlyBilling.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Overdue
  const overdueBilling = allBilling?.filter(b => b.status === "overdue") ?? [];
  const overdueCount = overdueBilling.length;
  const overdueTotal = overdueBilling.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Payment status distribution
  const statusCounts: Record<string, number> = {};
  allBilling?.forEach(b => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });

  // Per-property occupancy
  const propertyOccupancy = (accommodations ?? []).map(acc => {
    const propUnits = activeUnits.filter(u => u.accommodation_id === acc.accommodation_id);
    const totalCap = propUnits.reduce((s, u) => s + (u.max_occupancy || 0), 0);
    const currentOcc = propUnits.reduce((s, u) => s + (u.current_occupancy || 0), 0);
    const rate = totalCap > 0 ? (currentOcc / totalCap) * 100 : 0;
    return {
      id: acc.accommodation_id,
      name: acc.name,
      type: acc.accommodation_type,
      status: acc.accommodation_status,
      totalUnits: propUnits.length,
      totalCapacity: totalCap,
      currentOccupancy: currentOcc,
      availableSlots: totalCap - currentOcc,
      rate,
    };
  }).sort((a, b) => b.rate - a.rate);

  // Total occupancy rate
  const totalCapacity = activeUnits.reduce((s, u) => s + (u.max_occupancy || 0), 0);
  const totalOccupancy = activeUnits.reduce((s, u) => s + (u.current_occupancy || 0), 0);
  const occupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

  // Billing paid total
  const paidBilling = allBilling?.filter(b => b.status === "paid" || b.status === "paid_late") ?? [];
  const totalCollected = paidBilling.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalBilled = allBilling?.reduce((sum, b) => sum + (b.amount || 0), 0) ?? 0;
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // Alerts
  const alerts: { type: "warning" | "danger" | "info"; message: string }[] = [];
  propertyOccupancy.forEach(p => {
    if (p.rate >= 90) alerts.push({ type: "danger", message: `${p.name} is at ${p.rate.toFixed(0)}% capacity` });
    else if (p.rate >= 75) alerts.push({ type: "warning", message: `${p.name} is nearing capacity (${p.rate.toFixed(0)}%)` });
  });
  if (waitingListCount > 5) alerts.push({ type: "info", message: `${waitingListCount} students on waiting list` });
  if (overdueCount > 0) alerts.push({ type: "danger", message: `${overdueCount} overdue payment${overdueCount > 1 ? "s" : ""} totaling ₱${overdueTotal.toLocaleString()}` });

  // 8. User Profile & Notifications
  const profile = await userProfileService.getProfile(session.user.id);
  const { data: notifications } = await userProfileService.getNotifications(session.user.id);

  return (
    <DashboardClient
      user={session.user}
      profile={profile}
      notifications={notifications || []}
      stats={{
        totalProperties,
        totalUnits,
        occupiedUnits,
        availableUnits,
        studentsHoused,
        waitingListCount,
        revenueThisMonth,
        overdueCount,
        occupancyRate,
        collectionRate,
        totalCollected,
        totalBilled,
      }}
      propertyOccupancy={propertyOccupancy}
      recentApplications={(recentApplications as any) ?? []}
      pendingApplications={(pendingApplications as any) ?? []}
      housedStudents={(housedStudents as any) ?? []}
      billingStatusCounts={statusCounts}
      alerts={alerts}
    />
  );
}
