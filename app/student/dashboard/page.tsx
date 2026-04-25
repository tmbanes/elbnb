import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { userProfileService } from "@/services/user_profile";
import { getStudentBillsDetailed, getUserPaymentSummary } from "@/services/user-services";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import { redirect } from "next/navigation";
import StudentDashboardUI from "./student-dashboard-ui";

export default async function StudentDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
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
    userProfileService.getCurrentAccommodation(user.id),
    userProfileService.getAccommodationHistory(user.id),
    getUserPaymentSummary(user.id, "student"),
    getStudentBillsDetailed(user.id),
    userProfileService.getDashboardStats(user.id),
    UnitAccomodationsDisplayService.listAccomodations("student"),
    userProfileService.getDocuments(user.id),
    userProfileService.getNotifications(user.id)
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
