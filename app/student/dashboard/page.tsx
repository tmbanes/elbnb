import { userProfileService } from "@/services/user_profile";
import { getStudentBillsDetailed, getUserPaymentSummary } from "@/services/user-services";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import { redirect } from "next/navigation";
import StudentDashboardUI from "./student-dashboard-ui";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

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
    { data: documents },
    { data: notifications }
  ] = await Promise.all([
    userProfileService.getCurrentAccommodation(user.user_id),
    userProfileService.getAccommodationHistory(user.user_id),
    getUserPaymentSummary(user.user_id, "student"),
    getStudentBillsDetailed(user.user_id),
    userProfileService.getDashboardStats(user.user_id),
    UnitAccomodationsDisplayService.listAccomodations("student"),
    userProfileService.getDocuments(user.user_id),
    userProfileService.getNotifications(user.user_id)
  ]);

  return (
    <StudentDashboardUI
      user={user}
      currentResidency={currentResidency}
      history={history || []}
      billingSummary={billingSummary || { total: 0, paid: 0, balance: 0 }}
      bills={billsDetailed || []}
      stats={stats}
      accommodations={accommodations || []}
      documents={documents || []}
      notifications={notifications || []}
    />
  );
}
