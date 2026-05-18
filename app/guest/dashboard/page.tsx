// app/guest/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { userProfileService } from "@/services/user_profile";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import { redirect } from "next/navigation";
import GuestDashboardUI from "./guest-dashboard-ui";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { getStudentBillsDetailed } from "@/services/user-services";
import { resolveAccommodationImageDisplayUrl, withResolvedAccommodationImages } from "@/lib/actions/housing-actions";


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
    docsRes,
    billsRes,
    notificationsRes,
    accommodationsRes
  ] = await Promise.all([
    userProfileService.getProfile(user.user_id),
    userProfileService.getCurrentAccommodation(user.user_id),
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

  // Parallelize all image resolutions
  const [resolvedActiveResidency, resolvedHistory, resolvedApplications, resolvedAccommodations] = await Promise.all([
    // Active residency
    (async () => {
      const currentRes = activeResidencyRes.data as any;
      if (!currentRes) return null;

      const accommodation = currentRes.unit?.accommodation || null;
      if (accommodation?.image) {
        accommodation.image = await resolveAccommodationImageDisplayUrl(accommodation.image).catch(() => null);
      }

      return {
        ...currentRes,
        accommodation,
        unit: currentRes.unit ? {
          unit_number: currentRes.unit.unit_number,
          unit_type: currentRes.unit.unit_type
        } : null
      };
    })(),
    // History
    Promise.all((historyRes.data || []).map(async (item: any) => {
      if (item.accommodation?.image) {
        item.accommodation.image = await resolveAccommodationImageDisplayUrl(item.accommodation.image).catch(() => null);
      }
      return item;
    })),
    // Applications
    Promise.all((applicationsRes.data || []).map(async (item: any) => {
      if (item.accommodation?.image) {
        item.accommodation.image = await resolveAccommodationImageDisplayUrl(item.accommodation.image).catch(() => null);
      }
      return item;
    })),
    // Preview accommodations
    withResolvedAccommodationImages(accommodationsRes.data || []).catch(() => accommodationsRes.data || [])
  ]);

  return (
    <GuestDashboardUI
      profile={profileRes.data}
      initialActiveResidency={resolvedActiveResidency}
      initialApplications={resolvedApplications}
      initialHistory={resolvedHistory}
      initialBills={billsRes.data || []}
      notifications={notificationsRes.data || []}
      accommodations={resolvedAccommodations}
    />


  );
}

