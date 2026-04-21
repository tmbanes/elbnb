// app\manager\dashboard\page.tsx

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";
import ManagerDashboardUI from "./manager-dashboard-ui";

export default function DormitoryManagerDashboardPage() {
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
    <ManagerDashboardUI 
      onLogout={handleLogout} 
      isLoggingOut={isExiting} 
    />
  );
}
