// app/manager/dashboard/page.tsx

import { userProfileService } from "@/services/user_profile";
import { redirect } from "next/navigation";
import ManagerDashboardUI from "./manager-dashboard-ui";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function DormitoryManagerDashboardPage() {
  const user = await requireRole(['dormitory_manager']);
  const supabase = await createSupabaseServerClient();

  // Fetch all necessary data in parallel on the server
  const [
    profileRes,
    notificationsRes,
    accomRes,
    activityLogRes
  ] = await Promise.all([
    userProfileService.getProfile(user.user_id),
    userProfileService.getNotifications(user.user_id),
    supabase.from('accommodation').select('*').eq('manager_id', user.user_id).single(),
    supabase.from('activity_log').select('*').neq('entity_type', 'auth').order('timestamp', { ascending: false }).limit(10)
  ]);

  const profile = profileRes.data;
  const notifications = notificationsRes.data || [];
  const accom = accomRes.data;
  const activityLog = activityLogRes.data || [];

  // If no accommodation is managed by this user, we still want to show the dashboard but with empty states
  let units = [];
  let assignments = [];
  let waitlist = [];
  let recentApplications = [];
  let moveOutAlerts: { assignment_id: any; name: string; initials: string; avatar: any; unit_number: any; expected_move_out_date: any; days_left: number; }[] = [];

  if (accom) {
    const [unitsRes, waitlistRes, recentAppsRes] = await Promise.all([
      supabase.from('unit').select('*').eq('accommodation_id', accom.accommodation_id),
      supabase.from('accommodation_application')
        .select('*, user_id, users!user_id(user_id, first_name, last_name, profile_picture_url)')
        .eq('preferred_accommodation_id', accom.accommodation_id)
        .eq('application_status', 'approved')
        .order('date_submitted', { ascending: true }),
      supabase.from('accommodation_application')
        .select('*, user_id, users!user_id(user_id, first_name, last_name, profile_picture_url)')
        .eq('preferred_accommodation_id', accom.accommodation_id)
        .order('date_submitted', { ascending: false })
        .limit(5)
    ]);

    units = unitsRes.data || [];
    waitlist = (waitlistRes.data || []).map((app: any) => ({
      ...app,
      users: Array.isArray(app.users) ? app.users[0] : app.users
    }));
    recentApplications = (recentAppsRes.data || []).map((app: any) => ({
      ...app,
      users: Array.isArray(app.users) ? app.users[0] : app.users
    }));

    if (units.length > 0) {
      const unitIds = units.map(u => u.unit_id);

      // Fetch active assignments for these units
      const { data: activeAssignments } = await supabase
        .from('accommodation_assignment')
        .select(`
          *,
          user_id,
          users:user_id (
            user_id,
            first_name, 
            last_name, 
            profile_picture_url,
            student:student (student_number, college)
          ),
          unit:unit_id (unit_number)
        `)
        .eq('assignment_status', 'active')
        .in('unit_id', unitIds);

      assignments = activeAssignments || [];

      // Calculate Move-out Alerts
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);

      moveOutAlerts = assignments
        .filter(asg => {
          if (!asg.expected_move_out_date) return false;
          const moveOutDate = new Date(asg.expected_move_out_date);
          return moveOutDate >= today && moveOutDate <= in30Days;
        })
        .map(asg => ({
          assignment_id: asg.assignment_id,
          name: `${asg.users?.first_name || ''} ${asg.users?.last_name || ''}`.trim(),
          initials: `${asg.users?.first_name?.[0] || ''}${asg.users?.last_name?.[0] || ''}`.toUpperCase(),
          avatar: asg.users?.profile_picture_url,
          unit_number: asg.unit?.unit_number,
          expected_move_out_date: asg.expected_move_out_date,
          days_left: Math.ceil((new Date(asg.expected_move_out_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }));
    }
  }

  return (
    <ManagerDashboardUI
      profile={profile}
      notifications={notifications}
      initialData={{
        accom,
        units,
        assignments,
        waitlist,
        activityLog,
        recentApplications,
        moveOutAlerts
      }}
    />
  );
}
