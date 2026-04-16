// app\guest\dashboard\page.tsx

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState } from "react";

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
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-slate-900">Guest Dashboard</h1>
      <button 
        onClick={handleLogout}
        className="px-4 py-2 text-xs font-bold text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
      >
        Log Out
      </button>
    </main>
  );
}
