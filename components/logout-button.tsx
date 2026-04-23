"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function LogoutButton() {
  const supabase = getSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button 
      onClick={handleLogout}
      className="px-4 py-2 text-xs font-bold text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
    >
      Log Out
    </button>
  );
}
