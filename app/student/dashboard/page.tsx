// app\student\dashboard\page.tsx

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";
import StudentDashboardUI from "./student-dashboard-ui";

export default function StudentDashboardPage() {
  const supabase = getSupabaseBrowserClient();
  const [isExiting, setIsExiting] = useState(false);

  const handleLogout = async () => {
    setIsExiting(true);
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
