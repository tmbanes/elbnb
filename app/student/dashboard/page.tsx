import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { studentProfileService } from "@/services/student_profile";
import { getStudentBillsDetailed, getUserPaymentSummary } from "@/services/user-services";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import { redirect } from "next/navigation";
import StudentDashboardUI from "./student-dashboard-ui";
import { createActivityLog, getCurrentUserFromApi, isUserRole } from "@/services/activity_log/browser";


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
    { data: profile },
    { data: currentResidency },
    { data: history },
    { data: billingSummary },
    { data: billsDetailed },
    { data: stats },
    { data: accommodations },
    { data: documents },
    { data: notifications }
  ] = await Promise.all([
    studentProfileService.getProfile(user.id),
    studentProfileService.getCurrentAccommodation(user.id),
    studentProfileService.getAccommodationHistory(user.id),
    getUserPaymentSummary(user.id, "student"),
    getStudentBillsDetailed(user.id),
    studentProfileService.getDashboardStats(user.id),
    UnitAccomodationsDisplayService.listAccomodations("student"),
    studentProfileService.getDocuments(user.id),
    studentProfileService.getNotifications(user.id)
  ]);
  const handleLogout = async () => {
    setIsExiting(true);
    
    // Log the action for successful sign-out.
    const profile = await getCurrentUserFromApi();
    const userRole = isUserRole(profile?.role) ? profile.role : "guest";

    if (profile?.user_id) {
      await createActivityLog({
        p_user_id: profile.user_id,
        p_action_type: "logout",
        p_log_desc: `${profile.first_name} logged out `,
        p_entity_type: "auth",
        p_entity_id: profile.user_id,
        p_user_role: userRole,
      });
    }
      


    await supabase.auth.signOut();
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  };

  return (
    <StudentDashboardUI
      user={profile}
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
