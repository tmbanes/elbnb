// app\student\history\page.tsx

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";
import HistoryUI from "@/app/student/history/HistoryUI";

export default function HistoryPage() {
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
    <HistoryUI
      onLogout={handleLogout}
      isLoggingOut={isExiting}
    />
  );
}
