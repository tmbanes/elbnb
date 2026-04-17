// app\guest\dashboard\page.tsx

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";
import GuestDashboardUI from "./guest-dashboard-ui";

export default function GuestDashboardPage() {
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
    <GuestDashboardUI
      onLogout={handleLogout}
      isLoggingOut={isExiting}
    />
  );
}
