// app/guest/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { userProfileService } from "@/services/user_profile";
import { getStudentBillsDetailed } from "@/services/user-services";
import { redirect } from "next/navigation";
import GuestDashboardUI from "./guest-dashboard-ui";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function GuestDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getApiAuthenticatedUser();

  if (!user) {
    redirect("/onboarding");
  }

  // Fetch all guest dashboard data in parallel
  const [
    profileRes,
    activeResidencyRes,
    applicationsRes,
    historyRes,
    documentsRes,
    billsRes,
    notificationsRes
  ] = await Promise.all([
    userProfileService.getProfile(user.user_id),
    supabase
      .from('accommodation_assignment')
      .select(`
              *,
              accommodation:accommodation_id (*),
              unit:unit_id (*)
          `)
      .eq('user_id', user.user_id)
      .eq('assignment_status', 'active')
      .single(),
    supabase
      .from('accommodation_application')
      .select('*')
      .eq('user_id', user.user_id)
      .order('date_submitted', { ascending: false }),
    userProfileService.getAccommodationHistory(user.user_id),
    userProfileService.getDocuments(user.user_id),
    getStudentBillsDetailed(user.user_id),
    userProfileService.getNotifications(user.user_id)
  ]);

  return (
    <GuestDashboardUI
      profile={profileRes.data}
      initialActiveResidency={activeResidencyRes.data}
      initialApplications={applicationsRes.data || []}
      initialHistory={historyRes.data || []}
      initialDocuments={documentsRes.data || []}
      initialBills={billsRes.data || []}
      notifications={notificationsRes.data || []}
    />
  );
}

