// app\student\dashboard\page.tsx

"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";
import StudentDashboardUI from "./student-dashboard-ui";
import { createActivityLog, getCurrentUserFromApi, isUserRole } from "@/services/activity_log/browser";


export default function StudentDashboardPage() {
  const supabase = getSupabaseBrowserClient();
  const [isExiting, setIsExiting] = useState(false);

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
      onLogout={handleLogout}
      isLoggingOut={isExiting}
    />
  );
}
