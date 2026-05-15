import { userProfileService } from "@/services/user_profile";
import { getStudentBillsDetailed, getUserPaymentSummary } from "@/services/user-services";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import { redirect } from "next/navigation";
import StudentDashboardUI from "./student-dashboard-ui";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { resolveAccommodationImageDisplayUrl } from "@/lib/actions/housing-actions";


export default async function StudentDashboardPage() {
  const user = await getApiAuthenticatedUser();

  if (!user) {
    redirect("/onboarding");
  }

  // Fetch all necessary data for the student dashboard
  const [
    { data: currentResidency },
    { data: history },
    { data: billingSummary },
    { data: billsDetailed },
    { data: stats },
    { data: accommodations },
    { data: notifications }
  ] = await Promise.all([
    userProfileService.getCurrentAccommodation(user.user_id),
    userProfileService.getAccommodationHistory(user.user_id),
    getUserPaymentSummary(user.user_id, "student"),
    getStudentBillsDetailed(user.user_id),
    userProfileService.getDashboardStats(user.user_id),
    UnitAccomodationsDisplayService.listAccomodations("student"),
    userProfileService.getNotifications(user.user_id)
  ]);

  // Resolve current residency image if it exists
  if (currentResidency?.unit?.accommodation?.image) {
    currentResidency.unit.accommodation.image = await resolveAccommodationImageDisplayUrl(currentResidency.unit.accommodation.image).catch(() => null);
  }

  // Resolve history images
  const resolvedHistory = await Promise.all((history || []).map(async (item: any) => {
    if (item.accommodation?.image) {
      item.accommodation.image = await resolveAccommodationImageDisplayUrl(item.accommodation.image).catch(() => null);
    }
    return item;
  }));

  // Resolve accommodations preview images
  const { withResolvedAccommodationImages } = await import("@/lib/actions/housing-actions");
  const resolvedAccommodations = await withResolvedAccommodationImages(accommodations || []).catch(() => accommodations || []);


  return (
    <StudentDashboardUI
      user={user}
      currentResidency={currentResidency}
      history={resolvedHistory}
      billingSummary={billingSummary || { total: 0, paid: 0, balance: 0 }}
      bills={billsDetailed || []}
      stats={stats}
      accommodations={resolvedAccommodations}
      notifications={notifications || []}
    />
  );

}
