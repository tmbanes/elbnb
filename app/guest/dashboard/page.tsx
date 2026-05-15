// app/guest/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { userProfileService } from "@/services/user_profile";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import { redirect } from "next/navigation";
import GuestDashboardUI from "./guest-dashboard-ui";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { resolveAccommodationImageDisplayUrl } from "@/lib/actions/housing-actions";


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
    billsRes,
    notificationsRes,
    accommodationsRes
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
    userProfileService.getNotifications(user.user_id),
    UnitAccomodationsDisplayService.listAccomodations("guest")
  ]);

  // Resolve images for active residency
  const activeResidency = activeResidencyRes.data;
  if (activeResidency?.accommodation?.image) {
    activeResidency.accommodation.image = await resolveAccommodationImageDisplayUrl(activeResidency.accommodation.image).catch(() => null);
  }

  // Resolve images for history
  const resolvedHistory = await Promise.all((historyRes.data || []).map(async (item: any) => {
    if (item.accommodation?.image) {
      item.accommodation.image = await resolveAccommodationImageDisplayUrl(item.accommodation.image).catch(() => null);
    }
    return item;
  }));



  // Resolve images for applications
  const resolvedApplications = await Promise.all((applicationsRes.data || []).map(async (item: any) => {
    if (item.accommodation?.image) {
      item.accommodation.image = await resolveAccommodationImageDisplayUrl(item.accommodation.image).catch(() => null);
    }
    return item;
  }));

  return (
    <GuestDashboardUI
      profile={profileRes.data}
      initialActiveResidency={activeResidency}
      initialApplications={resolvedApplications}

      initialHistory={resolvedHistory}
      initialBills={billsRes.data || []}
      notifications={notificationsRes.data || []}
      accommodations={accommodationsRes.data || []}
    />

  );
}

