// app/manager/dashboard/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { studentProfileService } from "@/services/student_profile";
import { redirect } from "next/navigation";
import ManagerDashboardUI from "./manager-dashboard-ui";

export default async function DormitoryManagerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch manager profile
  const { data: profile } = await studentProfileService.getProfile(user.id);

  return (
    <ManagerDashboardUI
      profile={profile}
    />
  );
}
