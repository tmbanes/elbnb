// app\guest\dashboard\page.tsx

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";
<<<<<<< HEAD
=======
import GuestDashboardUI from "./guest-dashboard-ui";
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1

export default function GuestDashboardPage() {
  const supabase = getSupabaseBrowserClient();
  const [isExiting, setIsExiting] = useState(false);
<<<<<<< HEAD
  
  const handleLogout = async () => {
    setIsExiting(true); 
    await supabase.auth.signOut();
    
    setTimeout(() => {
      window.location.href = "/";
    }, 300); 
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-slate-900">Guest Dashboard</h1>
      <button 
        onClick={handleLogout}
        className="px-4 py-2 text-xs font-bold text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
      >
        Log Out
      </button>
    </main>
=======

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
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
  );
}
