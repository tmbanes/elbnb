import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { userProfileService } from "@/services/user_profile";
import { requireRole } from "@/lib/auth/session";
import { getAllBillsForAdmin } from "@/services/user-services";

export default async function AdminDashboardPage() {
  const session = await requireRole(['housing_admin', 'admin']);
  const supabase = supabaseAdmin;

  let managedAccommodationIds: string[] = [];
  const isHousingAdmin = session.role === "housing_admin";

  if (isHousingAdmin) {
    const { data: adminData } = await supabase
      .from("housing_admin")
      .select("accommodation_ids")
      .eq("user_id", session.user_id)
      .maybeSingle();
    managedAccommodationIds = adminData?.accommodation_ids || [];
  }

  let accommodations: any[] = [];
  let units: any[] = [];
  let studentsHousedCount = 0;
  let studentsHousedCount = 0;
  let pendingApplications: any[] = [];
  let recentApplications: any[] = [];
  let allBilling: any[] = [];
  let housedStudents: any[] = [];
  let profile: any = null;
  let notifications: any[] = [];
  let activityLogs: any[] = [];

  if (isHousingAdmin && managedAccommodationIds.length === 0) {
    const [profileRes, notificationsRes] = await Promise.all([
      userProfileService.getProfile(session.user_id),
      userProfileService.getNotifications(session.user_id)
    ]);
    profile = profileRes;
    notifications = notificationsRes.data || [];
  } else {
    let accommodationsQuery: any = supabase.from("accommodation").select("accommodation_id, name, accommodation_type, accommodation_status");
    let unitsQuery: any = supabase.from("unit").select("accommodation_id, max_occupancy, current_occupancy, unit_status");
    let activeAssignmentsQuery: any = supabase.from("accommodation_assignment").select("assignment_id", { count: 'exact', head: true });
    let accommodationsQuery: any = supabase.from("accommodation").select("accommodation_id, name, accommodation_type, accommodation_status");
    let unitsQuery: any = supabase.from("unit").select("accommodation_id, max_occupancy, current_occupancy, unit_status");
    let activeAssignmentsQuery: any = supabase.from("accommodation_assignment").select("assignment_id", { count: 'exact', head: true });
    let pendingApplicationsQuery: any = supabase.from("accommodation_application").select("application_id, user_id, application_status, date_submitted, preferred_accommodation_id, preferred_unit_type, users(first_name, last_name, email), accommodation(name)");
    let recentApplicationsQuery: any = supabase.from("accommodation_application").select("application_id, user_id, application_status, date_submitted, preferred_accommodation_id, preferred_unit_type, users(first_name, last_name, email), accommodation(name)");
    let housedStudentsQuery: any = supabase.from("accommodation_assignment").select("assignment_id, user_id, unit_id, move_in_date, expected_move_out_date, assignment_status, users(first_name, last_name, email), unit(unit_number, accommodation(name))");
    let activityLogsQuery: any = supabase
      .from("activity_log")
      .select("log_id, user_id, action_type, entity_type, entity_id, log_desc, timestamp, users(first_name, last_name, email)")
      .neq("entity_type", "auth")
      .neq("action_type", "login")
      .neq("action_type", "logout");

    if (isHousingAdmin) {
      accommodationsQuery = accommodationsQuery.in("accommodation_id", managedAccommodationIds);
      unitsQuery = unitsQuery.in("accommodation_id", managedAccommodationIds);

      activeAssignmentsQuery = activeAssignmentsQuery
        .select("assignment_id, unit!inner(accommodation_id)", { count: 'exact', head: true })
        .eq("assignment_status", "active")
        .in("unit.accommodation_id", managedAccommodationIds);

      pendingApplicationsQuery = pendingApplicationsQuery
        .in("application_status", ["pending_admin", "pending_dorm_manager"])
        .in("preferred_accommodation_id", managedAccommodationIds);

      recentApplicationsQuery = recentApplicationsQuery
        .in("preferred_accommodation_id", managedAccommodationIds);

      housedStudentsQuery = housedStudentsQuery
        .select("assignment_id, user_id, unit_id, move_in_date, expected_move_out_date, assignment_status, users(first_name, last_name, email), unit!inner(unit_number, accommodation!inner(name, accommodation_id))")
        .eq("assignment_status", "active")
        .in("unit.accommodation_id", managedAccommodationIds)
        .limit(20);
      if (managedAccommodationIds.length > 0) {
        activityLogsQuery = activityLogsQuery.or(`user_id.eq.${session.user_id},entity_id.in.(${managedAccommodationIds.join(",")})`);
      } else {
        activityLogsQuery = activityLogsQuery.eq("user_id", session.user_id);
      }
    } else {
      activeAssignmentsQuery = activeAssignmentsQuery.eq("assignment_status", "active");
      pendingApplicationsQuery = pendingApplicationsQuery.in("application_status", ["pending_admin", "pending_dorm_manager"]);
      housedStudentsQuery = housedStudentsQuery.eq("assignment_status", "active").limit(20);
    }

    const [
      accommodationsRes,
      unitsRes,
      activeAssignmentsRes,
      pendingApplicationsRes,
      recentApplicationsRes,
      billsRes,
      housedStudentsRes,
      profileRes,
      notificationsRes,
      activityLogsRes
    ] = await Promise.all([
      accommodationsQuery,
      unitsQuery,
      activeAssignmentsQuery,
      pendingApplicationsQuery.order("date_submitted", { ascending: false }),
      recentApplicationsQuery.order("date_submitted", { ascending: false }).limit(8),
      getAllBillsForAdmin(session.role || "", session.user_id || undefined),
      housedStudentsQuery,
      userProfileService.getProfile(session.user_id),
      userProfileService.getNotifications(session.user_id),
      activityLogsQuery.order("timestamp", { ascending: false }).limit(15)
    ]);

    accommodations = accommodationsRes.data || [];
    units = unitsRes.data || [];
    // Only capture count for students housed metric
    studentsHousedCount = activeAssignmentsRes.count || 0;
    pendingApplications = pendingApplicationsRes.data || [];
    recentApplications = recentApplicationsRes.data || [];
    allBilling = billsRes.data || [];
    housedStudents = housedStudentsRes.data || [];
    profile = profileRes;
    notifications = notificationsRes.data || [];
    activityLogs = activityLogsRes.data || [];
  }

  // Compute derived data
  const totalProperties = accommodations?.length ?? 0;
  const activeUnits = units?.filter(u => u.unit_status === "active") ?? [];
  const totalUnits = activeUnits.length;
  const occupiedUnits = activeUnits.filter(u => u.current_occupancy > 0).length;
  const availableUnits = totalUnits - occupiedUnits;
  const studentsHoused = studentsHousedCount;
  const waitingListCount = pendingApplications?.length ?? 0;

  // Revenue this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyBilling = allBilling?.filter(b => {
    if (!b.created_at) return false;
    const createdDate = new Date(b.created_at);
    return createdDate >= startOfMonth;
  }) ?? [];
  const revenueThisMonth = monthlyBilling
    .filter(b => b.status === "paid" || b.status === "paid_late")
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // Overdue
  const overdueBilling = allBilling?.filter(b => b.status === "overdue") ?? [];
  const overdueCount = overdueBilling.length;
  const overdueBalance = overdueBilling.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Unpaid
  const unpaidBilling = allBilling?.filter(b => b.status === "unpaid") ?? [];
  const unpaidBalance = unpaidBilling.reduce((sum, b) => sum + (b.amount || 0), 0);

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
  if (overdueCount > 0) alerts.push({ type: "danger", message: `${overdueCount} overdue payment${overdueCount > 1 ? "s" : ""} totaling ₱${overdueBalance.toLocaleString()}` });

  // Flatten applications and assignments data
  const flattenedRecent = (recentApplications || []).map((app: any) => ({
    ...app,
    users: Array.isArray(app.users) ? app.users[0] : app.users,
    accommodation: Array.isArray(app.accommodation) ? app.accommodation[0] : app.accommodation,
  }));

  const flattenedPending = (pendingApplications || []).map((app: any) => ({
    ...app,
    users: Array.isArray(app.users) ? app.users[0] : app.users,
    accommodation: Array.isArray(app.accommodation) ? app.accommodation[0] : app.accommodation,
  }));

  const flattenedHoused = (housedStudents || []).map((entry: any) => ({
    ...entry,
    users: Array.isArray(entry.users) ? entry.users[0] : entry.users,
    unit: Array.isArray(entry.unit) ? {
      ...entry.unit[0],
      accommodation: Array.isArray(entry.unit[0]?.accommodation) ? entry.unit[0].accommodation[0] : entry.unit[0]?.accommodation
    } : {
      ...entry.unit,
      accommodation: Array.isArray(entry.unit?.accommodation) ? entry.unit.accommodation[0] : entry.unit?.accommodation
    }
  }));

  return (
    <DashboardClient
      user={session}
      profile={profile.data}
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
        unpaidBalance,
        overdueBalance,
      }}
      propertyOccupancy={propertyOccupancy}
      recentApplications={flattenedRecent}
      pendingApplications={flattenedPending}
      housedStudents={flattenedHoused}
      billingStatusCounts={statusCounts}
      alerts={alerts}
      activityLogs={activityLogs}
    />
  );
}
